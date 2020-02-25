// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fse from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { DaprTaskDefinition } from "../tasks/daprCommandTaskProvider";
import { DaprdDownTaskDefinition } from "../tasks/daprdDownTaskProvider";
import scaffoldTask from "../scaffolding/taskScaffolder";
import scaffoldConfiguration, { getWorkspaceConfigurations } from '../scaffolding/configurationScaffolder';
import { scaffoldStateStoreComponent, scaffoldPubSubComponent } from "../scaffolding/daprComponentScaffolder";
import { localize } from '../util/localize';
import { UserInput, WizardStep } from '../services/userInput';
import { IActionContext, TelemetryProperties } from 'vscode-azureextensionui';

interface ScaffoldTelemetryProperties extends TelemetryProperties {
    configurationType: string;
}

async function onConflictingTask(): Promise<boolean> {
    return Promise.resolve(true);
}

async function scaffoldDaprComponents(): Promise<void> {
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
        await scaffoldStateStoreComponent(componentsPath);
        await scaffoldPubSubComponent(componentsPath);
    }
}

interface ScaffoldWizardContext {
    appId: string;
    appPort: number;
    configuration: vscode.DebugConfiguration;
}

const defaultPortMap: { [key: string]: number } = {
    'coreclr': 5000,
    'node': 3000,
    'node2': 3000,
    'python': 8000,
};

const defaultPort = 80;

export async function scaffoldDaprTasks(context: IActionContext, ui: UserInput): Promise<void> {
    const telemetryProperties = context.telemetry.properties as ScaffoldTelemetryProperties;

    const configurationStep: WizardStep<ScaffoldWizardContext> =
        async wizardContext => {
            const workspaceConfigurations = getWorkspaceConfigurations();
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
                appId: await ui.showInputBox({ prompt: localize('commands.scaffoldDaprTasks.appIdPrompt', 'Enter a Dapr ID for the application'), value: wizardContext.appId ?? 'app' })
            };
        };

    const appPortStep: WizardStep<ScaffoldWizardContext> =
        async wizardContext => {
            telemetryProperties.cancelStep = 'appPort';

            const appPort = wizardContext.appPort
                ?? (wizardContext.configuration?.type ? defaultPortMap[wizardContext.configuration.type] : undefined)
                ?? defaultPort;
            
            // TODO: Infer port from application manifest/project file, or application stack.
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

    const daprdUpTask: DaprTaskDefinition = {
        type: 'daprd',
        label: 'daprd-debug',
        appId: result.appId,
        appPort: result.appPort,
    };

    if (buildTask && buildTask !== daprdUpTask.label) {
        daprdUpTask.dependsOn = buildTask;
    }

    const daprdDownTask: DaprdDownTaskDefinition = {
        type: 'daprd-down',
        label: 'daprd-down',
        appId: result.appId
    };

    if (tearDownTask && tearDownTask !== daprdDownTask.label) {
        daprdDownTask.dependsOn = tearDownTask;
    }

    const daprDebugConfiguration = {
        ...result.configuration.configuration,
        name: localize('commands.scaffoldDaprTasks.configurationName', '{0} with Dapr', result.configuration.name),
        preLaunchTask: daprdUpTask.label,
        postDebugTask: daprdDownTask.label
    };

    await scaffoldTask(daprdUpTask, onConflictingTask);
    await scaffoldTask(daprdDownTask, onConflictingTask);
    await scaffoldConfiguration(daprDebugConfiguration, onConflictingTask);

    await scaffoldDaprComponents();
}

const createScaffoldDaprTasksCommand = (ui: UserInput) => (context: IActionContext): Promise<void> => scaffoldDaprTasks(context, ui);

export default createScaffoldDaprTasksCommand;
