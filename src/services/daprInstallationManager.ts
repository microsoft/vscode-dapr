export interface DaprVersion {
    cli: string;
    runtime: string;
}

export interface DaprInstallationManager {
    getVersion(): Promise<DaprVersion | undefined>;
    isInitialized(): Promise<boolean>;
}

export default class LocalDaprInstallationManager implements DaprInstallationManager {
    getVersion(): Promise<DaprVersion | undefined> {
        return Promise.resolve(undefined);
    }

    isInitialized(): Promise<boolean> {
        return Promise.resolve(false);
    }
}
