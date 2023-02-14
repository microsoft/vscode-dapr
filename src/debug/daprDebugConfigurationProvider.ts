// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as nls from 'vscode-nls';
import * as vscode from 'vscode';
import { getLocalizationPathForFile } from '../util/localization';
import { DaprApplication, DaprApplicationProvider } from '../services/daprApplicationProvider';
import { filter, first, firstValueFrom, map, race, timeout } from 'rxjs';
import { debugApplication } from '../commands/applications/debugApplication';
import { UserInput } from '../services/userInput';
import { withAggregateTokens } from '../util/aggregateCancellationTokenSource';
import { fromCancellationToken } from '../util/observableCancellationToken';
import { fromRunFilePath, getAppId } from '../util/runFileReader';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface DaprDebugConfiguration extends vscode.DebugConfiguration {
    excludeApps?: string[];
    includeApps?: string[];
    runFile: string;
}

async function getAppIdsToDebug(configuration: DaprDebugConfiguration): Promise<Set<string>> {
    if (configuration.includeApps) {
        return new Set<string>(configuration.includeApps);
    }

    const runFile = await fromRunFilePath(vscode.Uri.file(configuration.runFile));

    const appIds = new Set<string>();

    for (const app of (runFile.apps ?? [])) {
        const appId = getAppId(app);

        if (configuration.excludeApps === undefined || !configuration.excludeApps.includes(appId)) {
            appIds.add(appId);
        }
    }

    return appIds;
}

export class DaprDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
    constructor(
        private readonly daprApplicationProvider: DaprApplicationProvider,
        private readonly userInput: UserInput) {
    }

    async resolveDebugConfigurationWithSubstitutedVariables?(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration, debugToken?: vscode.CancellationToken): Promise<vscode.DebugConfiguration | undefined> {
        const daprDebugConfiguration = <DaprDebugConfiguration>debugConfiguration;

        const appIds = await getAppIdsToDebug(daprDebugConfiguration);

        await this.userInput.withProgress(
            localize('debug.daprDebugConfigurationProvider.attachingProgress', 'Attaching to Dapr applications...'),
            (process, userToken) => withAggregateTokens(token => this.attachToApplications(daprDebugConfiguration.runFile, appIds, token), userToken, debugToken));

        return undefined;
    }

    private async attachToApplications(runFile: string, appIds: Set<string>, token: vscode.CancellationToken): Promise<void> {
        const applications = await this.waitForApplications(runFile, appIds, token);

        await this.waitForAttach(applications, token);
    }

    private async waitForApplications(runFile: string, appIds: Set<string>, token: vscode.CancellationToken): Promise<DaprApplication[]> {
        const applicationMonitor = this.daprApplicationProvider
            .applications
            .pipe(
                // Include only those applications that are part of the run...
                map(apps => apps.filter(app => app.runTemplatePath === runFile)),
                // Include only those applications that are running...
                map(apps => apps.filter(app => app.appPid !== 0)),
                // Include only those applications to be attached...
                map(apps => apps.filter(app => appIds.has(app.appId))),
                // Notify only when all services are running...
                filter(apps => apps.length === appIds.size),
                // Complete on the first notification (of all services running)...
                first(),
                // Ultimately timeout after 1 min...
                timeout(60000));

        // Wait either for all applications running, or the user cancels, or eventually times out...
        const applications =
            await firstValueFrom(
                race(
                    applicationMonitor,
                    fromCancellationToken(token)));

        //
        // NOTE: Applications should always be valid (as otherwise an exception would have been raised).
        //

        if (!applications) {
            throw new Error(localize('debug.daprDebugConfigurationProvider.noApplicationsRunning', 'No applications were found to be running.'));
        }

        return applications;
    }

    private async waitForAttach(applications: DaprApplication[], token: vscode.CancellationToken) {
        let hadFailures = false;

        for (const application of applications) {
            if (token.isCancellationRequested) {
                break;
            }

            try {
                await debugApplication(application);
            } catch {
                hadFailures = true;
            }
        }

        if (hadFailures) {
            throw new Error(localize('debug.daprDebugConfigurationProvider.hadFailures', 'The debugger failed to attach to all applications.'));
        }
    }
}