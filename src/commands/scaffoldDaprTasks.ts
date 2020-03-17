// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fse from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { DaprTaskDefinition } from "../tasks/daprCommandTaskProvider";
import { DaprdDownTaskDefinition } from "../tasks/daprdDownTaskProvider";
import { getWorkspaceConfigurations } from '../scaffolding/configurationScaffolder';
import { scaffoldStateStoreComponent, scaffoldPubSubComponent } from "../scaffolding/daprComponentScaffolder";
import { localize } from '../util/localize';
import { UserInput, WizardStep } from '../services/userInput';
import { IActionContext, TelemetryProperties } from 'vscode-azureextensionui';
import { TemplateScaffolder } from '../scaffolding/templateScaffolder';
import { Scaffolder } from '../scaffolding/scaffolder';
import { ConflictHandler } from '../scaffolding/conflicts';

interface ScaffoldTelemetryProperties extends TelemetryProperties {
    configurationType: string;
}

async function onConflictingTask(): Promise<boolean> {
    return Promise.resolve(true);
}

async function scaffoldDaprComponents(templateScaffolder: TemplateScaffolder): Promise<void> {
    // TODO: Verify open workspace/folder.
    const rootWorkspaceFolderPath = (vscode.workspace.workspaceFolders ?? [])[0]?.uri?.fsPath;

    if (!rootWorkspaceFolderPath) {
        throw new Error(localize('commands.scaffoldDaprTasks.noWorkspaceError', 'Open a folder or workspace.'));
    }

    const componentsPath = path.join(rootWorkspaceFolderPath, 'components');

    await fse.ensureDir(componentsPath);

    const components = await fse.readdir(componentsPath);

    // Only scaffold the components if none exist...
    if (components.length === 0) {
        await scaffoldStateStoreComponent(templateScaffolder, componentsPath);
        await scaffoldPubSubComponent(templateScaffolder, componentsPath);
    }
}

interface ScaffoldWizardContext {
    appId: string;
    appPort: number;
    configuration: vscode.DebugConfiguration;
}

const DefaultPort = 80;
const DjangoPort = 8000;
const FlaskPort = 5000;
const JavaPort = 8080;
const NetCorePort = 5000;
const NodePort = 3000;

function getDefaultPort(configuration: vscode.DebugConfiguration | undefined): number {
    switch (configuration?.type) {
        case 'coreclr':
            return NetCorePort;

        case 'java':
            return JavaPort;

        case 'node':
        case 'node2':
            return NodePort;

        case 'python':
            // "module": "flask" is a primary indicator of a Flask application...
            if (configuration?.module === 'flask') {
                return FlaskPort;
            }

            // "django": true is a primary indicator of a Django application...
            if (configuration?.django === true) {
                return DjangoPort;
            }

            // "jinja": true is a secondary indicator of a Flask application...
            if (configuration?.jinja === true) {
                return FlaskPort;
            }

            // Django seems to have a slight edge over Flask in popularity, so default to that...
            return DjangoPort;
    }

    return DefaultPort;
}

function* range(start = 0) {
    while (true) {
        yield start++;
    }
}

function* nameGenerator(prefix: string, rangeGenerator: Generator<number, void, unknown>) {
    let index = rangeGenerator.next();

    while (!index.done) {
        yield `${prefix}${index.value}`;

        index = rangeGenerator.next();
    }
}

export async function scaffoldDaprTasks(context: IActionContext, scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder, ui: UserInput): Promise<void> {
    const telemetryProperties = context.telemetry.properties as ScaffoldTelemetryProperties;

    const configurationStep: WizardStep<ScaffoldWizardContext> =
        async wizardContext => {
            const workspaceConfigurations = getWorkspaceConfigurations();

            if (workspaceConfigurations.length === 0) {
                context.errorHandling.suppressReportIssue = true;

                throw new Error(localize('commands.scaffoldDaprTasks.noConfigurationsMessage', 'Open a folder or workspace with a debug launch configuration.'));
            }

            const configurationItems = workspaceConfigurations.map(configuration => ({ label: configuration.name, configuration }));

            telemetryProperties.cancelStep = 'configuration';

            const debugConfigurationItem = await ui.showQuickPick(configurationItems, { placeHolder: localize('commands.scaffoldDaprTasks.configurationPlaceholder', 'Select the configuration used to debug the application') });

            return {
                ...wizardContext,
                configuration: debugConfigurationItem.configuration
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

            const appPort = wizardContext.appPort ?? getDefaultPort(wizardContext.configuration);
            
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

    const onTaskConflict: ConflictHandler =
        async (label, isUnique) => {
            const overwrite: vscode.MessageItem = { title: localize('commands.scaffoldDaprTasks.overwriteTask', 'Overwrite') };
            const newTask: vscode.MessageItem = { title: localize('commands.scaffoldDaprTasks.createTask', 'Create task') };

            const result = await ui.showWarningMessage(localize('commands.scaffoldDaprTasks.taskExists', 'The task \'{0}\' already exists. Do you want to overwrite it or create a new task?', label), overwrite, newTask);

            if (result === overwrite) {
                return { 'type': 'overwrite' };
            } else {
                const generator = nameGenerator(`${label ?? ''}-`, range(1));
                let name = generator.next();

                while (!name.done && !await isUnique(name.value)) {
                    name = generator.next();
                }

                if (name.done) {
                    throw new Error(localize('commands.scaffoldDaprTasks.renameError', 'Unable to generate a unique task.'));
                }

                return { 'type': 'rename', name: name.value };
            }
        };

    const preLaunchTask = await scaffolder.scaffoldTask(
        'daprd-debug',
        label => {
            const daprdUpTask: DaprTaskDefinition = {
                appId: result.appId,
                appPort: result.appPort,
                label,
                type: 'daprd'
            };
        
            if (buildTask && buildTask !== label) {
                daprdUpTask.dependsOn = buildTask;
            }

            return daprdUpTask;
        },
        onTaskConflict);

    const postDebugTask = await scaffolder.scaffoldTask(
        'daprd-down',
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
        name => {
            return {
                ...result.configuration,
                name,
                preLaunchTask,
                postDebugTask
            };
        },
        onConflictingTask);

    await scaffoldDaprComponents(templateScaffolder);
}

const createScaffoldDaprTasksCommand = (scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder, ui: UserInput) => (context: IActionContext): Promise<void> => scaffoldDaprTasks(context, scaffolder, templateScaffolder, ui);

export default createScaffoldDaprTasksCommand;
