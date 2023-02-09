// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import CommandLineBuilder from "../util/commandLineBuilder";
import { LineOutputHandler, Process } from "../util/process";
import * as nls from 'vscode-nls';
import { getLocalizationPathForFile } from '../util/localization';
import { DaprApplication } from "./daprApplicationProvider";
import * as os from 'os'
import { AsyncDisposable } from "../util/asyncDisposable";

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface DaprVersion {
    cli: string | undefined;
    runtime: string | undefined;
}

export interface DaprDashboard extends AsyncDisposable {
    readonly url: string;
}

export interface DaprCliClient {
    startDashboard(): Promise<DaprDashboard>;
    version(): Promise<DaprVersion>;
    stopApp(application: DaprApplication | undefined): void;
    stopRun(runTemplatePath: string): Promise<void>;
}

interface DaprCliVersion {
    'Cli version'?: string;
    'Runtime version'?: string;
}

export default class LocalDaprCliClient implements DaprCliClient {
    private static readonly DashboardRunningRegex = /^Dapr Dashboard running on (?<url>.+)$/;

    constructor(private readonly daprPathProvider: () => string) {
    }

    async startDashboard(): Promise<DaprDashboard> {
        const command =
            CommandLineBuilder
                .create(this.daprPathProvider(), 'dashboard', '--port', '0')
                .build();

        let onLine: (line: string) => void;

        const readyTask = new Promise<string>(
            resolve => {
                onLine = (line: string) => {
                    const match = LocalDaprCliClient.DashboardRunningRegex.exec(line);
        
                    if (match) {
                        const url = match.groups?.['url'];
        
                        if (url) {
                            resolve(url);
                        }
                    }
                };
            });

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const outputHandler = new LineOutputHandler(onLine!);

        try {
            const process = await Process.spawnProcess(command, { outputHandler });

            const url = await readyTask;

            return {
                dispose: () => process.killAll(),
                url
            };
        } finally {
            outputHandler.dispose();
        }
    }

    async version(): Promise<DaprVersion> {
        const daprPath = this.daprPathProvider();
        const command =
            CommandLineBuilder
                .create(daprPath, 'version', '--output', 'json')
                .build();

        const result = await Process.exec(command);

        if (result.code !== 0) {
            throw new Error(localize('services.daprCliClient.versionFailed', 'Retrieving the dapr CLI version failed: {0}', result.stderr));
        }

        const cliVersion = JSON.parse(result.stdout) as DaprCliVersion;

        return {
            cli: cliVersion['Cli version'],
            runtime: cliVersion['Runtime version']
        }
    }

    stopApp(application: DaprApplication | undefined): void {
        const processId = application?.ppid !== undefined ? application.ppid : application?.pid;
        if (os.platform() === 'win32') {
            // NOTE: Windows does not support SIGTERM/SIGINT/SIGBREAK, so there can be no graceful process shutdown.
            //       As a partial mitigation, use `taskkill` to kill the entire process tree.
            processId !== undefined ? void Process.exec(`taskkill /pid ${processId} /t /f`) : null;
        } else {
            processId !== undefined ? process.kill(processId, 'SIGTERM') : null;
        } 
    }

    async stopRun(runTemplateFile: string): Promise<void> {
        const daprPath = this.daprPathProvider();

        const command =
            CommandLineBuilder
                .create(daprPath, 'stop')
                .withNamedArg("--run-file", runTemplateFile)
                .build();

        const result = await Process.exec(command);

        if (result.code !== 0) {
            throw new Error(localize('services.daprCliClient.stopRunFailed', 'Stopping the run failed: {0}', result.stderr));
        }
    }
}