// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as semver from 'semver';
import { DaprCliClient } from './daprCliClient';
import * as nls from 'vscode-nls';
import { getLocalizationPathForFile } from '../util/localization';
import { IErrorHandlingContext } from 'vscode-azureextensionui';
import { UserInput } from './userInput';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface DaprInstallationManager {
    ensureInstalled(context?: IErrorHandlingContext): Promise<void>;
    ensureInstalledVersion(cliVersion: string, context?: IErrorHandlingContext): Promise<void>;

    ensureInitialized(context?: IErrorHandlingContext): Promise<void>;
    ensureInitializedVersion(cliVersion: string, runtimeVersion: string, context?: IErrorHandlingContext): Promise<void>;

    isInstalled(): Promise<boolean>;
    isVersionInstalled(cliVersion: string): Promise<boolean>;

    isInitialized(): Promise<boolean>;
    isVersionInitialized(cliVersion: string, runtimeVersion: string): Promise<boolean>;
}

function isSemverSatisfied(version: string, range: string): boolean {
    return semver.satisfies(version, range, { includePrerelease: true });
}

export default class LocalDaprInstallationManager implements DaprInstallationManager {
    private readonly satisfiedCliVersions = new Set<string>();
    private readonly satisfiedRuntimeVersions = new Set<string>();

    constructor(
        private readonly expectedCliVersion: string,
        private readonly expectedRuntimeVersion: string,
        private readonly daprCliClient: DaprCliClient,
        private readonly ui: UserInput) {
    }

    ensureInstalled(context?: IErrorHandlingContext): Promise<void> {
        return this.ensureInstalledVersion(this.expectedCliVersion, context);
    }

    async ensureInstalledVersion(cliVersion: string, context?: IErrorHandlingContext): Promise<void> {
        const isVersionInstalled = await this.isVersionInstalled(cliVersion);

        if (!isVersionInstalled) {
            if (context) {
                context.buttons = [
                    {
                        callback: async () => {
                            await this.ui.executeCommand('vscode-dapr.help.installDapr')
                        },
                        title: localize('services.daprInstallationManager.installLatestTitle', 'Install Latest Dapr')
                    }
                ];

                context.suppressReportIssue = true;
            }

            throw new Error(localize('services.daprInstallationManager.versionNotInstalled', 'A compatible version of the Dapr CLI has not been found. You may need to install a more recent version.'));
        }
    }

    ensureInitialized(context?: IErrorHandlingContext): Promise<void> {
        return this.ensureInitializedVersion(this.expectedCliVersion, this.expectedRuntimeVersion, context);
    }

    async ensureInitializedVersion(cliVersion: string, runtimeVersion: string, context?: IErrorHandlingContext): Promise<void> {
        const isVersionInstalled = await this.isVersionInitialized(cliVersion, runtimeVersion);

        if (!isVersionInstalled) {
            if (context) {
                context.buttons = [
                    {
                        callback: async () => {
                            await this.ui.executeCommand('vscode-dapr.help.installDapr')
                        },
                        title: localize('services.daprInstallationManager.installLatestTitle', 'Install Latest Dapr')
                    }
                ];

                context.suppressReportIssue = true;
            }

            throw new Error(localize('services.daprInstallationManager.versionNotInitialized', 'A compatible version of Dapr has not been initialized. You may need to install a more recent version.'));
        }
    }

    isInstalled(): Promise<boolean> {
        return this.isVersionInstalled(this.expectedCliVersion);
    }

    async isVersionInstalled(cliVersion: string): Promise<boolean> {      
        if (this.satisfiedCliVersions.has(cliVersion)) {
            return true;
        }

        try {
            const version = await this.daprCliClient.version();
            
            if (version.cli !== undefined && isSemverSatisfied(version.cli, cliVersion)) {
                this.satisfiedCliVersions.add(cliVersion);

                return true;
            }
        }
        catch {
            // No-op.
        }
        
        return false;
    }

    isInitialized(): Promise<boolean> {
        return this.isVersionInitialized(this.expectedCliVersion, this.expectedRuntimeVersion);
    }

    async isVersionInitialized(cliVersion: string, runtimeVersion: string): Promise<boolean> {      
        if (this.satisfiedCliVersions.has(cliVersion) && 
            this.satisfiedRuntimeVersions.has(runtimeVersion)) {
            return true;
        }

        try {
            const version = await this.daprCliClient.version();

            let cliVersionSatisfied = false;

            if (version.cli === 'edge'
                || (version.cli !== undefined && isSemverSatisfied(version.cli, cliVersion))) {
                this.satisfiedCliVersions.add(cliVersion);

                cliVersionSatisfied = true;
            }

            let runtimeVersionSatisfied = false;

            if (version.runtime !== undefined
                && version.runtime !== 'n/a'
                && isSemverSatisfied(version.runtime, runtimeVersion)) {
                this.satisfiedRuntimeVersions.add(runtimeVersion);

                runtimeVersionSatisfied = true;
            }

            if (cliVersionSatisfied && runtimeVersionSatisfied) {
                return true;
            }
        }
        catch {
            // No-op.
        }
        
        return false;
    }
}
