// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { URL } from 'url';
import { DaprTaskDefinition } from "../tasks/daprCommandTaskProvider";
import { DaprdDownTaskDefinition } from "../tasks/daprdDownTaskProvider";
import { getWorkspaceConfigurations, DebugConfiguration } from '../scaffolding/configurationScaffolder';
import { UserInput, WizardStep } from '../services/userInput';
import { IActionContext, TelemetryProperties } from '@microsoft/vscode-azext-utils';
import { TemplateScaffolder } from '../scaffolding/templateScaffolder';
import { Scaffolder } from '../scaffolding/scaffolder';
import { ConflictHandler, ConflictUniquenessPredicate } from '../scaffolding/conflicts';
import { names, range } from '../util/generators';
import { getLocalizationPathForFile } from '../util/localization';
import { TextDecoder } from 'util';
import path from 'path';
import { DaprDebugConfiguration } from '../debug/daprDebugConfigurationProvider';


const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

interface ScaffoldTelemetryProperties extends TelemetryProperties {
    configurationType: string;
}

interface ScaffoldWizardContext {
    appId: string;
    appPort: number;
    configuration: DebugConfiguration;
    folder: vscode.WorkspaceFolder;
}

const DefaultPort = 80;
const DjangoPort = 8000;
const FlaskPort = 5000;
const JavaPort = 8080;
const NetCorePort = 5000;
const NodePort = 3000;

interface DotNetProfile {
    commandName?: string;
    applicationUrl?: string;
}

interface DotNetLaunchSettings {
    profiles?: { [key: string]: DotNetProfile };
}

async function getDefaultDotnetPort(folder: vscode.WorkspaceFolder | undefined): Promise<number> {
    if (folder) {
        const launchSettingsFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, "**/Properties/launchSettings.json"));

        for (const launchSettingsFile of launchSettingsFiles) {
            const launchSettingsBuffer = await vscode.workspace.fs.readFile(launchSettingsFile);
            const launchSettingsContents = new TextDecoder('utf-8').decode(launchSettingsBuffer);
            const launchSettingsJson = JSON.parse(launchSettingsContents) as DotNetLaunchSettings;

            if (launchSettingsJson.profiles) {
                const projectProfile = Object.values(launchSettingsJson.profiles).find(profile => profile.commandName === 'Project');

                if (projectProfile?.applicationUrl) {
                    const applicationUrls = projectProfile.applicationUrl.split(';');

                    for (const applicationUrl of applicationUrls) {
                        try {
                            const url = new URL(applicationUrl);

                            if (url.protocol === 'http:' && url.port) {
                                return parseInt(url.port, 10);
                            }
                        }
                        catch {
                            // NOTE: Ignore any errors parsing the URL.
                        }
                    }
                }
            }
        }
    }

    return NetCorePort;
}

function getDefaultPort(configuration: DebugConfiguration | undefined, folder: vscode.WorkspaceFolder | undefined): Promise<number> {
    switch (configuration?.type) {
        case 'coreclr':
            return getDefaultDotnetPort(folder);

        case 'java':
            return Promise.resolve(JavaPort);

        case 'node':
        case 'node2':
        case 'pwa-node':
            return Promise.resolve(NodePort);

        case 'python':
            // "module": "flask" is a primary indicator of a Flask application...
            if (configuration?.module === 'flask') {
                return Promise.resolve(FlaskPort);
            }

            // "django": true is a primary indicator of a Django application...
            if (configuration?.django === true) {
                return Promise.resolve(DjangoPort);
            }

            // "jinja": true is a secondary indicator of a Flask application...
            if (configuration?.jinja === true) {
                return Promise.resolve(FlaskPort);
            }

            // Django seems to have a slight edge over Flask in popularity, so default to that...
            return Promise.resolve(DjangoPort);
    }

    return Promise.resolve(DefaultPort);
}

async function createUniqueName(prefix: string, isUnique: ConflictUniquenessPredicate): Promise<string> {
    const nameGenerator = names(prefix, range(1));
    let name = nameGenerator.next();

    while (!name.done && !await isUnique(name.value)) {
        name = nameGenerator.next();
    }

    if (name.done) {
        throw new Error(localize('commands.scaffoldDaprTasks.uniqueNameError', 'Unable to generate a unique name.'));
    }

    return name.value;
}

export async function scaffoldDaprTasks(context: IActionContext, scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder, ui: UserInput): Promise<void> {
    const telemetryProperties = context.telemetry.properties as ScaffoldTelemetryProperties;

    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
        context.errorHandling.suppressReportIssue = true;

        throw new Error(localize('commands.scaffoldDaprTasks.noFolderOrWorkspace', 'Open a folder or workspace.'));
    }

    const runFilePath = path.join(folder.uri.fsPath, 'dapr.yaml');

    const runFilePathString = '$(workspaceFolder)/dapr.yaml';
    const daprTaskType = 'dapr';
    const daprConfigType = 'dapr';

    const onTaskConflict: ConflictHandler =
        async (label, isUnique) => {
            telemetryProperties.cancelStep = 'taskConflict';

            const overwrite: vscode.MessageItem = { title: localize('commands.scaffoldDaprTasks.overwriteTask', 'Overwrite') };
            const newTask: vscode.MessageItem = { title: localize('commands.scaffoldDaprTasks.createTask', 'Create task') };

            const result = await ui.showWarningMessage(
                localize('commands.scaffoldDaprTasks.taskExists', 'The task \'{0}\' already exists. Do you want to overwrite it or create a new task?', label),
                { modal: true },
                overwrite, newTask);

            if (result === overwrite) {
                return { 'type': 'overwrite' };
            } else {
                label = await createUniqueName(localize('commands.scaffoldDaprTasks.taskPrefix', '{0}-', label), isUnique);

                return { 'type': 'rename', name: label };
            }
        };

    const onConfigConflict: ConflictHandler = async (name, isUnique) => {
        telemetryProperties.cancelStep = 'configurationConflict';

        const overwrite: vscode.MessageItem = { title: localize('commands.scaffoldDaprTasks.overwriteConfiguration', 'Overwrite') };
        const newConfiguration: vscode.MessageItem = { title: localize('commands.scaffoldDaprTasks.createConfiguration', 'Create configuration') };

        const result = await ui.showWarningMessage(
            localize('commands.scaffoldDaprTasks.configurationExists', 'The configuration \'{0}\' already exists. Do you want to overwrite it or create a new configuration?', name),
            { modal: true },
            overwrite, newConfiguration);

        if (result === overwrite) {
            return { 'type': 'overwrite' };
        } else {
            name = await createUniqueName(localize('commands.scaffoldDaprTasks.configurationPrefix', '{0} - ', name), isUnique);

            return { 'type': 'rename', name };
        }
    };

    if (await vscode.workspace.fs.stat(vscode.Uri.file(runFilePath)).then(() => true, () => false)) {
        const runFileTask: vscode.MessageItem = { title: localize('commands.scaffoldDaprTasks.useExistingDaprRunFile', 'Use Run File') };
        const defaultTask: vscode.MessageItem = { title: localize('commands.scaffoldDaprTasks.notUseExistingDaprRunFile', 'Run Dapr Directly') };
        const result = await ui.showWarningMessage('You already have a Dapr run file. Would you like to use it in the scaffolded task?',
            { modal: true },
            runFileTask, defaultTask);

        if (result === runFileTask) {
            const preLaunchTask = await scaffolder.scaffoldTask(
                'dapr', folder,
                label => {
                    const daprUpTask: DaprTaskDefinition = {
                        label,
                        type: daprTaskType,
                        runFile: runFilePathString,
                    };
                    return daprUpTask;
                }, onTaskConflict);

            await scaffolder.scaffoldConfiguration(
                'Launch Dapr', folder,
                name => {
                    const daprDebugConfiguration: DaprDebugConfiguration = {
                        name,
                        request: 'launch',
                        type: daprConfigType,
                        runFile: runFilePathString,
                        preLaunchTask
                    };
                    return daprDebugConfiguration;
                }, onConfigConflict);
            return;
        }
    }
    else {
        const configurationStep: WizardStep<ScaffoldWizardContext> =
            async wizardContext => {
                const folder = vscode.workspace.workspaceFolders?.[0];

                if (!folder) {
                    context.errorHandling.suppressReportIssue = true;

                    throw new Error(localize('commands.scaffoldDaprTasks.noFolderOrWorkspace', 'Open a folder or workspace.'));
                }

                const workspaceConfigurations = getWorkspaceConfigurations(folder);

                if (workspaceConfigurations.length === 0) {
                    context.errorHandling.suppressReportIssue = true;

                    throw new Error(localize('commands.scaffoldDaprTasks.noConfigurationsMessage', 'Open a folder or workspace with a folder-scoped debug launch configuration.'));
                }

                const configurationItems = workspaceConfigurations.map(configuration => ({ label: configuration.name, configuration }));

                telemetryProperties.cancelStep = 'configuration';

                const debugConfigurationItem = await ui.showQuickPick(configurationItems, { placeHolder: localize('commands.scaffoldDaprTasks.configurationPlaceholder', 'Select the configuration used to debug the application') });

                return {
                    ...wizardContext,
                    configuration: debugConfigurationItem.configuration,
                    folder: folder
                };
            };

        const appIdStep: WizardStep<ScaffoldWizardContext> =
            async wizardContext => {
                telemetryProperties.cancelStep = 'appId';

                // TODO: Infer name from application manifest/project file, or repo folder name.
                return {
                    ...wizardContext,
                    appId: await ui.showInputBox(
                        {
                            prompt: localize('commands.scaffoldDaprTasks.appIdPrompt', 'Enter a Dapr ID for the application'),
                            value: wizardContext.appId ?? 'app',
                            validateInput: value => {
                                return value === ''
                                    ? localize('commands.scaffoldDaprTasks.invalidAppId', 'An application ID must be a non-empty string.')
                                    : undefined;
                            }
                        })
                };
            };

        const appPortStep: WizardStep<ScaffoldWizardContext> =
            async wizardContext => {
                telemetryProperties.cancelStep = 'appPort';

                const appPort = wizardContext.appPort ?? await getDefaultPort(wizardContext.configuration, wizardContext.folder);

                const appPortString = await ui.showInputBox(
                    {
                        prompt: localize('commands.scaffoldDaprTasks.portPrompt', 'Enter the port on which the application listens.'),
                        validateInput: value => {
                            if (/^\d+$/.test(value)) {
                                const port = parseInt(value, 10);

                                if (port >= 1 && port <= 65535) {
                                    return undefined;
                                }
                            }

                            return localize('commands.scaffoldDaprTasks.invalidPortMessage', 'A valid port number is a positive integer (1 to 65535).');
                        },
                        value: appPort.toString()
                    });

                return {
                    ...wizardContext,
                    appPort: parseInt(appPortString, 10)
                };
            };

        const result = await ui.showWizard({ title: localize('commands.scaffoldDaprTasks.wizardTitle', 'Scaffold Dapr Tasks') }, configurationStep, appIdStep, appPortStep);

        const buildTask = result.configuration.preLaunchTask;
        const tearDownTask = result.configuration.postDebugTask;

        telemetryProperties.configurationType = result.configuration.type;


        const preLaunchTask = await scaffolder.scaffoldTask(
            'dapr-debug',
            result.folder,
            label => {
                const daprUpTask: DaprTaskDefinition = {
                    appId: result.appId,
                    appPort: result.appPort,
                    label,
                    type: daprTaskType
                };

                if (buildTask && buildTask !== label) {
                    daprUpTask.dependsOn = buildTask;
                }

                return daprUpTask;
            },
            onTaskConflict);

        const postDebugTask = await scaffolder.scaffoldTask(
            'daprd-down',
            result.folder,
            label => {
                const daprdDownTask: DaprdDownTaskDefinition = {
                    appId: result.appId,
                    label,
                    type: 'daprd-down'
                };

                if (tearDownTask && tearDownTask !== label) {
                    daprdDownTask.dependsOn = tearDownTask;
                }

                return daprdDownTask;
            },
            onTaskConflict);

        await scaffolder.scaffoldConfiguration(
            localize('commands.scaffoldDaprTasks.configurationName', '{0} with Dapr', result.configuration.name),
            result.folder,
            name => {
                return {
                    ...result.configuration,
                    name,
                    preLaunchTask,
                    postDebugTask
                };
            },
            onConfigConflict);
    }
}

const createScaffoldDaprTasksCommand = (scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder, ui: UserInput) => (context: IActionContext): Promise<void> => scaffoldDaprTasks(context, scaffolder, templateScaffolder, ui);

export default createScaffoldDaprTasksCommand;
