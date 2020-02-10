// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { TaskDefinition } from '../tasks/taskDefinition';

function isConflictingTask(taskA: TaskDefinition, taskB: TaskDefinition): boolean {
    if (taskA.label && taskB.label) {
        return taskA.label === taskB.label;
    } else if (!taskA.label && !taskB.label) {
        return taskA.type === taskB.type;
    } else {
        return false;
    }
}

export function getWorkspaceTasks(): TaskDefinition[] {
    const workspaceConfigurations = vscode.workspace.getConfiguration('tasks');
    
    return workspaceConfigurations.tasks ?? [];
}

export default async function scaffoldTask(task: TaskDefinition, onConflict: (task: TaskDefinition) => Promise<boolean>): Promise<boolean> {
    const workspaceConfigurations = vscode.workspace.getConfiguration('tasks');
    const workspaceTasks: TaskDefinition[] = workspaceConfigurations.tasks ?? [];

    const conflictingTaskIndex = workspaceTasks.findIndex(existingTask => isConflictingTask(existingTask, task));

    if (conflictingTaskIndex >= 0) {
        if (await onConflict(workspaceTasks[conflictingTaskIndex])){
            workspaceTasks[conflictingTaskIndex] = task;
        } else {
            return false;
        }
    } else {
        workspaceTasks.push(task);
    }

    await workspaceConfigurations.update('tasks', workspaceTasks);

    return true;
}