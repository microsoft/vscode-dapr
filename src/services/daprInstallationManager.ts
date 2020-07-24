// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AsyncLazy } from '../util/lazy';
import { Process } from '../util/process';

export interface DaprVersion {
    cli: string | undefined;
    runtime: string | undefined;
}

export interface DaprInstallationManager {
    getVersion(): Promise<DaprVersion | undefined>;
    isInitialized(): Promise<boolean>;
}

function getCliVersion(versionOutput: string): string | undefined {
    const result = /^CLI version: (?<version>\d+.\d+.\d+)\s*/gm.exec(versionOutput);

    return result?.groups?.['version'];
}

function getRuntimeVersion(versionOutput: string): string | undefined {
    const result = /^Runtime version: (?<version>\d+.\d+.\d+)\s*/gm.exec(versionOutput);

    return result?.groups?.['version'];
}

interface DockerProcessContainer {
    Image?: string;
}

export default class LocalDaprInstallationManager implements DaprInstallationManager {
    private readonly version: AsyncLazy<DaprVersion>;
    private readonly initialized: AsyncLazy<boolean>;

    constructor() {
        this.version = new AsyncLazy<DaprVersion>(
            async () => {
                const versionResult = await Process.exec('dapr --version');

                if (versionResult.code === 0) {
                    return {
                        cli: getCliVersion(versionResult.stdout),
                        runtime: getRuntimeVersion(versionResult.stdout)
                    };
                }

                return undefined;
            });

        this.initialized = new AsyncLazy<boolean>(
            async () => {
                const psResult = await Process.exec('docker ps --format "{{json .}}"');

                if (psResult.code === 0) {
                    const lines = psResult.stdout.split('\n');
                    const containers = lines.map(line => <DockerProcessContainer>JSON.parse(line));
                    const daprContainers = containers.filter(container => container.Image === 'daprio/dapr');

                    if (daprContainers.length >= 0) {
                        return true;
                    }
                }

                return undefined;
            });
    }

    async getVersion(): Promise<DaprVersion | undefined> {
        try {
            return await this.version.getValue();
        } catch {
            // No-op errors.
        }

        return undefined;
    }

    async isInitialized(): Promise<boolean> {
        try {
            if (await this.initialized.getValue()) {
                return true;
            }
        } catch {
            // No-op errors.
        }

        return false;
    }
}
