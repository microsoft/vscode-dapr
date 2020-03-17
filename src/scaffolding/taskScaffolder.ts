// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { TaskDefinition } from '../tasks/taskDefinition';

function isConflictingTask(label: string, taskB: TaskDefinition): boolean {
    if (label && taskB.label) {
        return label === taskB.label;
    } else {
        return false;
    }
}

export interface OverwriteResult {
    type: 'overwrite';
}

export interface RenameResult {
    type: 'rename';
    value: string;
}

export interface SkipResult {
    type: 'skip';
}

export type ConflictResult = OverwriteResult | RenameResult | SkipResult;
export type TaskContentFactory = (label: string | undefined) => TaskDefinition;
export type TaskConflictHandler = (task: TaskDefinition) => Promise<ConflictResult>;

export function getWorkspaceTasks(): TaskDefinition[] {
    const workspaceConfigurations = vscode.workspace.getConfiguration('tasks');
    
    return workspaceConfigurations.tasks ?? [];
}

export default async function scaffoldTask(label: string, contentFactory: TaskContentFactory, onConflict: TaskConflictHandler): Promise<string | undefined> {
    const workspaceConfigurations = vscode.workspace.getConfiguration('tasks');
    const workspaceTasks: TaskDefinition[] = workspaceConfigurations.tasks ?? [];

    let taskIndex: number | undefined;

    const conflictingTaskIndex = workspaceTasks.findIndex(existingTask => isConflictingTask(label, existingTask));

    if (conflictingTaskIndex >= 0) {
        const result = await onConflict(workspaceTasks[conflictingTaskIndex]);

        switch (result.type) {
            case 'overwrite':
                taskIndex = conflictingTaskIndex;
                break;
            case 'rename':
                label = result.value;
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