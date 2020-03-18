// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { TaskDefinition } from '../tasks/taskDefinition';
import { ConflictHandler } from './conflicts';

export type TaskContentFactory = (label: string) => TaskDefinition;

export function getWorkspaceTasks(): TaskDefinition[] {
    const workspaceConfigurations = vscode.workspace.getConfiguration('tasks');
    
    return workspaceConfigurations.tasks ?? [];
}

export default async function scaffoldTask(label: string, contentFactory: TaskContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
    const workspaceConfigurations = vscode.workspace.getConfiguration('tasks');
    const workspaceTasks: TaskDefinition[] = workspaceConfigurations.tasks ?? [];

    let taskIndex: number | undefined;

    const getConflictingIndex = (targetLabel: string): number => workspaceTasks.findIndex(task => task.label === targetLabel);
    const conflictingTaskIndex = getConflictingIndex(label);

    if (conflictingTaskIndex >= 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const result = await onConflict(label, targetLabel => Promise.resolve(getConflictingIndex(targetLabel) === -1));

        switch (result.type) {
            case 'overwrite':
                taskIndex = conflictingTaskIndex;
                break;
            case 'rename':
                label = result.name;
                break;
            case 'skip':
                return undefined;
        }
    }

    const task = contentFactory(label);

    if (taskIndex !== undefined) {
        workspaceTasks[taskIndex] = task;
    } else {
        workspaceTasks.push(task);
    }

    await workspaceConfigurations.update('tasks', workspaceTasks);

    return label;
}