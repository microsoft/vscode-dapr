// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import CommandLineBuilder from "../util/commandLineBuilder";
import { Process } from "../util/process";
import * as nls from 'vscode-nls';
import { getLocalizationPathForFile } from '../util/localization';
import { DaprApplication } from "./daprApplicationProvider";
import * as os from 'os'
import * as vscode from 'vscode';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface DaprVersion {
    cli: string | undefined;
    runtime: string | undefined;
}

export interface DaprCliClient {
    startDashboard(token: vscode.CancellationToken): Promise<string>;
    version(): Promise<DaprVersion>;
    stopApp(application: DaprApplication | undefined): void;
}

interface DaprCliVersion {
    'Cli version'?: string;
    'Runtime version'?: string;
}

export default class LocalDaprCliClient implements DaprCliClient {
    private static readonly DashboardRunningRegex = /^Dapr Dashboard running on (?<url>.+)$/;

    constructor(private readonly daprPathProvider: () => string) {
    }

    async startDashboard(token: vscode.CancellationToken): Promise<string> {
        const command =
            CommandLineBuilder
                .create(this.daprPathProvider(), 'dashboard', '--port', '0')
                .build();

        let url = '';

        await Process.start(
            command,
            line => {
                const match = LocalDaprCliClient.DashboardRunningRegex.exec(line);

                if (match) {
                    url = match.groups?.['url'] ?? '';

                    if (url) {
                        return true;
                    }
                }

                return false;
            },
            {},
            token);

        return url;
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
}