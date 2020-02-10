// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export interface DebugConfiguration extends vscode.DebugConfiguration {
    preLaunchTask?: string;
    postDebugTask?: string;
}

function isConflictingTask(taskA: DebugConfiguration, taskB: DebugConfiguration): boolean {
    return taskA.name === taskB.name;
}

export function getWorkspaceConfigurations(): DebugConfiguration[] {
    const workspaceConfigurations = vscode.workspace.getConfiguration('launch');
    
    return workspaceConfigurations.configurations ?? [];
}

export default async function scaffoldConfiguration(configuration: DebugConfiguration, onConflict: (configuration: DebugConfiguration) => Promise<boolean>): Promise<boolean> {
    const workspaceConfiguration = vscode.workspace.getConfiguration('launch');
    const workspaceConfigurations: DebugConfiguration[] = workspaceConfiguration.configurations ?? [];

    const conflictingConfigurationIndex = workspaceConfigurations.findIndex(existingConfiguration => isConflictingTask(existingConfiguration, configuration));

    if (conflictingConfigurationIndex >= 0) {
        if (await onConflict(workspaceConfigurations[conflictingConfigurationIndex])){
            workspaceConfigurations[conflictingConfigurationIndex] = configuration;
        } else {
            return false;
        }
    } else {
        workspaceConfigurations.push(configuration);
    }

    await workspaceConfiguration.update('configurations', workspaceConfigurations);

    return true;
}