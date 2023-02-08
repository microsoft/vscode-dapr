// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as cp from 'child_process';
import internal from 'stream';
import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import * as localization from './localization';
import * as readline from 'node:readline';
import { treeKill } from './treeKill';

const localize = nls.loadMessageBundle(localization.getLocalizationPathForFile(__filename));

const DEFAULT_BUFFER_SIZE = 24 * 1024; // The default Node.js `exec` buffer size is 1 MB, our actual usage is far less

function bufferToString(buffer: Buffer): string {
    // Node.js treats null bytes as part of the length, which makes everything mad
    // There's also a trailing newline everything hates, so we'll remove
    return buffer.toString().replace(/\0/g, '').replace(/\r?\n$/g, '');
}

export interface ProcessOutputHandler {
    listen(stderr: internal.Readable | null, stdout: internal.Readable | null): void;
}

export interface SpawnOptions extends cp.SpawnOptions {
    outputHandler?: ProcessOutputHandler;
}

export class LineOutputHandler extends vscode.Disposable implements ProcessOutputHandler {
    private rl: readline.Interface | undefined;

    constructor(private readonly onLine: (line: string) => void) {
        super(
            () => {
                this.rl?.close();
            });
    }

    listen(stderr: internal.Readable | null, stdout: internal.Readable | null): void {
        if (stdout) {
            this.rl = readline.createInterface({
                input: stdout,
            });
            
            this.rl.on('line', this.onLine);
        }
    }
}

export class WrittenOutputHandler extends vscode.Disposable implements ProcessOutputHandler {
    private readonly onStdErrCallback: (data: string | Buffer) => void;
    private readonly onStdOutCallback: (data: string | Buffer) => void;

    private stderr: internal.Readable | null = null;
    private stdout: internal.Readable | null = null;

    constructor(
        onStdErr: (data: string) => void,
        onStdOut: (data: string) => void) {
        super(
            () => {
                this.stderr?.removeListener('data', this.onStdErrCallback);
                this.stdout?.removeListener('data', this.onStdOutCallback);
            });

        this.onStdErrCallback = data => onStdErr(data.toString());
        this.onStdOutCallback = data => onStdOut(data.toString());
    }

    listen(stderr: internal.Readable | null, stdout: internal.Readable | null): void {
        this.stderr = stderr;
        this.stdout = stdout;

        if (stderr) {
            stderr.on('data', this.onStdErrCallback);
        }

        if (stdout) {
            stdout.on('data', this.onStdOutCallback);
        }
    }
}

export class BufferedOutputHandler extends WrittenOutputHandler {
    private stdoutBytesWritten = 0;
    private stderrBytesWritten = 0;

    constructor(private readonly maxBuffer: number = DEFAULT_BUFFER_SIZE) {
        super(
            data => { this.stderrBytesWritten += this.stderrBuffer.write(data.toString(), this.stderrBytesWritten); },
            data => { this.stdoutBytesWritten += this.stdoutBuffer.write(data.toString(), this.stdoutBytesWritten); });

        this.stdoutBuffer = Buffer.alloc(maxBuffer);
        this.stderrBuffer = Buffer.alloc(maxBuffer);
    }

    public readonly stdoutBuffer: Buffer;
    public readonly stderrBuffer: Buffer;
}

export class Process {
    static async exec(command: string, options?: cp.ExecOptions, token?: vscode.CancellationToken): Promise<{ code: number; stderr: string; stdout: string }> {
        const outputHandler = new BufferedOutputHandler();

        try {
            const code = await Process.spawn(command, { ...options, outputHandler }, token);

            return {
                code,
                stderr: bufferToString(outputHandler.stderrBuffer),
                stdout: bufferToString(outputHandler.stdoutBuffer)
            };
        } finally {
            outputHandler.dispose();
        }
    }

    static async start(command: string, readyPredicate: (stdout: string) => boolean, options?: cp.SpawnOptions, token?: vscode.CancellationToken): Promise<void> {
        let outputHandler: LineOutputHandler | undefined;
        
        try {
            const waiter = new Promise<void>(
                resolve => {
                    outputHandler = new LineOutputHandler(
                        line => {
                            if (readyPredicate(line)) {
                                resolve();
                            }
                        });
                });

            void Process.spawn(command, { ...options, outputHandler }, token);

            await waiter;
        } finally {
            outputHandler?.dispose();
        }
    }

    static spawn(command: string, options?: SpawnOptions, token?: vscode.CancellationToken): Promise<number> {
        return new Promise(
            (resolve, reject) => {

                // Without the shell option, it pukes on arguments
                options = options || {};
                options.shell ??= true;

                const process = cp.spawn(command, options);

                process.on(
                    'error',
                    err => {
                        return reject(err);
                    });

                process.on(
                    'exit',
                    (code?: number, signal?: string) => {
                        if (code !== undefined) {
                            return resolve(code);
                        } else {
                            return reject(new Error(localize('util.process.exitErrorMessage', 'Process exited due to signal \'{0}\'.', signal)));
                        }
                    });

                options.outputHandler?.listen(process.stderr, process.stdout);

                if (token) {
                    const tokenListener = token.onCancellationRequested(
                        () => {
                            if (process.pid !== undefined) {
                                process.kill();
                            }

                            tokenListener.dispose();
                        });
                }
            });
    }

    static async spawnProcess(command: string, options?: SpawnOptions): Promise<SpawnedProcess> {
        options = options || {};
        options.shell ??= true;

        const process = cp.spawn(command, options);

        options.outputHandler?.listen(process.stderr, process.stdout);

        const spawnTask = new Promise<void>(
            (resolve, reject) => {
                process.on(
                    'spawn',
                    () => {
                        resolve();
                    });

                process.on(
                    'error',
                    err => {
                        reject(err);
                    });
            });

        await spawnTask;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const pid = process.pid!;

        return {
            pid,
            kill: () => new Promise(
                resolve => {
                    if (process.exitCode === null) {
                        process.once('exit', resolve);
                    } else {
                        resolve();
                    }
                }),
            killAll: async () => treeKill(pid)
        }
    }
}

export interface SpawnedProcess {
    pid: number;

    kill(): Promise<void>;
    killAll(): Promise<void>;
}