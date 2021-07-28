// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import CommandLineBuilder from "../util/commandLineBuilder";
import { Process } from "../util/process";
import * as nls from 'vscode-nls';
import { getLocalizationPathForFile } from '../util/localization';
import { DaprApplication } from "./daprApplicationProvider";
import * as os from 'os'

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface DaprVersion {
    cli: string | undefined;
    runtime: string | undefined;
}

export interface DaprCliClient {
    version(): Promise<DaprVersion>;
    stopApp(application: DaprApplication | undefined): void;
}

export default class LocalDaprCliClient implements DaprCliClient {
    constructor(private readonly daprPathProvider: () => string) {
    }

    async version(): Promise<DaprVersion> {
        const daprPath = this.daprPathProvider();
        const command =
            CommandLineBuilder
                .create(daprPath, '--version')
                .build();

        const result = await Process.exec(command);

        if (result.code !== 0) {
            throw new Error(localize('services.daprCliClient.versionFailed', 'Retrieving the dapr CLI version failed: {0}', result.stderr));
        }

        const cliMatch = /^CLI version: (?<version>.+)$/gm.exec(result.stdout);  
        const runtimeMatch = /^Runtime version: (?<version>.+)$/gm.exec(result.stdout);

        return {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            cli: cliMatch ? cliMatch.groups!['version'] : undefined,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            runtime: runtimeMatch ? runtimeMatch.groups!['version'] : undefined
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