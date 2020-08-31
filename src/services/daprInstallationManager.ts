// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as process from 'process';
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

const daprImageName = 'daprio/dapr';
const daprTaggedImagePrefix = `${daprImageName}:`;

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
                const network = process.env.DAPR_NETWORK || 'bridge';
                const psResult = await Process.exec(`docker ps --filter network=${network} --format "{{.ID}}"`);

                if (psResult.code === 0) {
                    const containerIds = psResult.stdout.split('\n').filter(id => id.length > 0);

                    if (containerIds.length > 0) {
                        const inspectResult = await Process.exec(`docker inspect ${containerIds.join(' ')} --format "{{.Config.Image}}"`);
                        
                        if (inspectResult.code === 0) {
                            const containerImages = inspectResult.stdout.split('\n');
                            
                            if (containerImages.find(image => image === daprImageName || image.startsWith(daprTaggedImagePrefix))) {
                                return true;
                            }
                        }
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
