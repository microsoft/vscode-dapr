// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import CommandLineBuilder from "../util/commandLineBuilder";
import { Process } from "../util/process";
import * as nls from 'vscode-nls';
import { getLocalizationPathForFile } from '../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface DaprVersion {
    cli: string | undefined;
    runtime: string | undefined;
}

export interface DaprCliClient {
    version(): Promise<DaprVersion>;
}

export default class LocalDaprCliClient implements DaprCliClient {
    constructor(private readonly daprPathProvider: () => Promise<string>) {
    }

    async version(): Promise<DaprVersion> {
        const daprPath = await this.daprPathProvider();
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
}