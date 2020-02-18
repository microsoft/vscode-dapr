// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fse from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { DaprTaskDefinition } from "../tasks/daprCommandTaskProvider";
import { DaprdDownTaskDefinition } from "../tasks/daprdDownTaskProvider";
import ext from "../ext";
import scaffoldTask from "../scaffolding/taskScaffolder";
import scaffoldConfiguration, { getWorkspaceConfigurations } from '../scaffolding/configurationScaffolder';
import { scaffoldStateStoreComponent, scaffoldPubSubComponent } from "../scaffolding/daprComponentScaffolder";
import { localize } from '../util/localize';

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

export default async function scaffoldDaprTasks(): Promise<void> {
    // TODO: Infer name from application manifest/project file, or repo folder name.
    const appId = await ext.ui.showInputBox({ prompt: localize('commands.scaffoldDaprTasks.appIdPrompt', 'Enter a Dapr ID for the application'), value: 'app' });
    // TODO: Infer port from application manifest/project file, or application stack.
    const appPortString = await ext.ui.showInputBox({ prompt: localize('commands.scaffoldDaprTasks.portPrompt', 'Enter the port on which the application listens.'), value: '5000' });
    const appPort = parseInt(appPortString, 10);

    const workspaceConfigurations = getWorkspaceConfigurations();
    const configurationItems = workspaceConfigurations.map(configuration => ({ label: configuration.name, configuration }));

    const debugConfigurationItem = await ext.ui.showQuickPick(configurationItems, { placeHolder: localize('commands.scaffoldDaprTasks.configurationPlaceholder', 'Select the configuration used to debug the application') });

    const buildTask = debugConfigurationItem.configuration.preLaunchTask;
    const tearDownTask = debugConfigurationItem.configuration.postDebugTask;

    const daprdUpTask: DaprTaskDefinition = {
        type: 'daprd',
        label: 'daprd-debug',
        appId,
        appPort,
    };

    if (buildTask && buildTask !== daprdUpTask.label) {
        daprdUpTask.dependsOn = buildTask;
    }

    const daprdDownTask: DaprdDownTaskDefinition = {
        type: 'daprd-down',
        label: 'daprd-down',
        appId
    };

    if (tearDownTask && tearDownTask !== daprdDownTask.label) {
        daprdDownTask.dependsOn = tearDownTask;
    }

    const daprDebugConfiguration = {
        ...debugConfigurationItem.configuration,
        name: localize('commands.scaffoldDaprTasks.configurationName', '{0} with Dapr', debugConfigurationItem.configuration.name),
        preLaunchTask: daprdUpTask.label,
        postDebugTask: daprdDownTask.label
    };

    await scaffoldTask(daprdUpTask, onConflictingTask);
    await scaffoldTask(daprdDownTask, onConflictingTask);
    await scaffoldConfiguration(daprDebugConfiguration, onConflictingTask);

    await scaffoldDaprComponents();
}
