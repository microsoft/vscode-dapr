import * as fs from 'fs/promises';
import * as nls from 'vscode-nls';
import * as path from 'path';
import * as vscode from 'vscode';
import { load } from 'js-yaml';
import { getLocalizationPathForFile } from '../util/localization';
import { DaprApplicationProvider } from '../services/daprApplicationProvider';
import { filter, map, switchMap, takeWhile } from 'rxjs';
import { debugApplication } from '../commands/applications/debugApplication';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface DaprDebugConfiguration extends vscode.DebugConfiguration {
    runFile: string;
}

interface DaprRunApplication {
    appDirPath?: string;
    appID?: string;
}

interface DaprRunFile {
    apps?: DaprRunApplication[];
}

function getAppId(app: DaprRunApplication): string {
    if (app.appID) {
        return app.appID;
    }

    if (app.appDirPath) {
        return path.basename(app.appDirPath);
    }

    throw new Error(localize('debug.daprDebugConfigurationProvider.unableToDetermineAppId', 'Unable to determine a configured application\'s ID.'));
}

export class DaprDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
    constructor(private readonly daprApplicationProvider: DaprApplicationProvider) {
    }

    async resolveDebugConfigurationWithSubstitutedVariables?(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration, token?: vscode.CancellationToken): Promise<vscode.DebugConfiguration | undefined> {
        const daprDebugConfiguration = <DaprDebugConfiguration>debugConfiguration;

        const runFileContent = await fs.readFile(daprDebugConfiguration.runFile, { encoding: 'utf8' });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const runFile = load(runFileContent) as DaprRunFile;

        const appIds = new Set<string>(runFile.apps?.map(getAppId) ?? []);

        await new Promise<void>(
            (resolve, reject) => {
                const subscription =
                    this.daprApplicationProvider
                        .applications
                        .pipe(
                            // Include only those applications that are part of the run...
                            map(apps => apps.filter(app => app.runTemplatePath === daprDebugConfiguration.runFile)),
                            // Include only those applications that are running...
                            map(apps => apps.filter(app => app.appPid !== 0)),
                            // Include only those applications remaining to be attached...
                            map(apps => apps.filter(app => appIds.has(app.appId))),
                            // Ignore empty set...
                            filter(apps => apps.length > 0),
                            // Attach to apps not yet attached...
                            switchMap(
                                async apps => {
                                    for (const app of apps) {
                                        // TODO: Catch errors to keep trying...
                                        await debugApplication(app);

                                        appIds.delete(app.appId);
                                    }
                                }))
                        .subscribe(
                            {
                                next: () => {
                                    if (appIds.size === 0) {
                                        subscription.unsubscribe();
                                        resolve();
                                        }
                                },
                                error: error => reject(error),
                                complete: () => {
                                    subscription.unsubscribe();
                                    resolve();
                                }
                            });
            })
            
        return undefined;
    }
}
