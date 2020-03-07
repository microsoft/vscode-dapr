import { Process } from "../util/process";

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

export default class LocalDaprInstallationManager implements DaprInstallationManager {
    async getVersion(): Promise<DaprVersion | undefined> {
        try {
            const versionResult = await Process.exec('dapr --version');

            if (versionResult.code === 0) {
                return {
                    cli: getCliVersion(versionResult.stdout),
                    runtime: getRuntimeVersion(versionResult.stdout)
                };
            }
        } catch {
            // No-op errors.
        }
        return undefined;
    }

    isInitialized(): Promise<boolean> {
        return Promise.resolve(false);
    }
}
