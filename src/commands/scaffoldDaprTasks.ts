import { DaprTaskDefinition } from "../tasks/daprCommandTaskProvider";
import { DaprdDownTaskDefinition } from "../tasks/daprdDownTaskProvider";
import scaffoldTask from "../scaffolding/taskScaffolder";
import { TaskDefinition } from "vscode";
import ext from "../ext";

async function onConflictingTask(task: TaskDefinition): Promise<boolean> {
    return Promise.resolve(true);
}

export default async function scaffoldDaprTasks() {
    const appId = await ext.ui.showInputBox({ prompt: 'Enter a Dapr ID for the application', value: 'app' });

    const daprdUpTask: DaprTaskDefinition = {
        type: 'daprd',
        label: 'daprd-debug',
        appId
    };

    const daprdDownTask: DaprdDownTaskDefinition = {
        type: 'daprd-down',
        label: 'daprd-down',
        appId
    };

    await scaffoldTask(daprdUpTask, onConflictingTask);
    await scaffoldTask(daprdDownTask, onConflictingTask);
}
