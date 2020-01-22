import * as fse from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { DaprTaskDefinition } from "../tasks/daprCommandTaskProvider";
import { DaprdDownTaskDefinition } from "../tasks/daprdDownTaskProvider";
import ext from "../ext";
import scaffoldTask from "../scaffolding/taskScaffolder";
import scaffoldConfiguration, { getWorkspaceConfigurations } from '../scaffolding/configurationScaffolder';
import { scaffoldStateStoreComponent, scaffoldPubSubComponent } from "../scaffolding/daprComponentScaffolder";

async function onConflictingTask(): Promise<boolean> {
    return Promise.resolve(true);
}

async function scaffoldDaprComponents(): Promise<void> {
    // TODO: Verify open workspace/folder.
    const rootWorkspaceFolderPath = (vscode.workspace.workspaceFolders ?? [])[0]?.uri?.fsPath;

    if (!rootWorkspaceFolderPath) {
        throw new Error('Open a folder or workspace.');
    }

    const componentsPath = path.join(rootWorkspaceFolderPath, 'components');

    await fse.ensureDir(componentsPath);

    const stateStoreComponentPath = path.join(componentsPath, 'redis.yaml');
    const pubSubComponentPath = path.join(componentsPath, 'redis_messagebus.yaml');

    const redisHost = "localhost";

    await scaffoldStateStoreComponent(stateStoreComponentPath, redisHost);
    await scaffoldPubSubComponent(pubSubComponentPath, redisHost);
}

export default async function scaffoldDaprTasks(): Promise<void> {
    // TODO: Infer name from application manifest/project file, or repo folder name.
    const appId = await ext.ui.showInputBox({ prompt: 'Enter a Dapr ID for the application', value: 'app' });
    // TODO: Infer port from application manifest/project file, or application stack.
    const appPortString = await ext.ui.showInputBox({ prompt: 'Enter the port on which the application listens.', value: '5000' });
    const appPort = parseInt(appPortString, 10);

    const workspaceConfigurations = getWorkspaceConfigurations();
    const configurationItems = workspaceConfigurations.map(configuration => ({ label: configuration.name, configuration }));

    const debugConfigurationItem = await ext.ui.showQuickPick(configurationItems, { placeHolder: 'Select the configuration used to debug the application' });

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
        name: `${debugConfigurationItem.configuration.name} with Dapr`,
        preLaunchTask: daprdUpTask.label,
        postDebugTask: daprdDownTask.label
    };

    await scaffoldTask(daprdUpTask, onConflictingTask);
    await scaffoldTask(daprdDownTask, onConflictingTask);
    await scaffoldConfiguration(daprDebugConfiguration, onConflictingTask);

    await scaffoldDaprComponents();
}
