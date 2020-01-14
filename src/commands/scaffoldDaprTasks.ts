import { DaprTaskDefinition } from "../tasks/daprCommandTaskProvider";
import { DaprdDownTaskDefinition } from "../tasks/daprdDownTaskProvider";
import scaffoldTask from "../scaffolding/taskScaffolder";
import { TaskDefinition } from "vscode";

async function onConflictingTask(task: TaskDefinition): Promise<boolean> {
    return Promise.resolve(true);
}

export default async function scaffoldDaprTasks() {
    const daprdUpTask: DaprTaskDefinition = {
        type: 'daprd'
    };

    const daprdDownTask: DaprdDownTaskDefinition = {
        type: 'daprd-down'
    };

    await scaffoldTask(daprdUpTask, onConflictingTask);
    await scaffoldTask(daprdDownTask, onConflictingTask);
}
