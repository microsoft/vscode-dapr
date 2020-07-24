// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { ConflictHandler } from './conflicts';

export interface DebugConfiguration extends vscode.DebugConfiguration {
    preLaunchTask?: string;
    postDebugTask?: string;
}

export type ConfigurationContentFactory = (name: string) => DebugConfiguration;

export function getWorkspaceConfigurations(folder: vscode.WorkspaceFolder): DebugConfiguration[] {
    const workspaceConfigurations = vscode.workspace.getConfiguration('launch', folder.uri);
    
    return (<DebugConfiguration[]>workspaceConfigurations.configurations) ?? [];
}

export default async function scaffoldConfiguration(name: string, folder: vscode.WorkspaceFolder, contentFactory: ConfigurationContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
    const workspaceConfiguration = vscode.workspace.getConfiguration('launch', folder.uri);
    const workspaceConfigurations: DebugConfiguration[] = (<DebugConfiguration[]>workspaceConfiguration.configurations) ?? [];

    let configurationIndex: number | undefined;


    const getConflictingIndex = (targetName: string): number => workspaceConfigurations.findIndex(configuration => configuration.name === targetName);
    const conflictingConfigurationIndex = getConflictingIndex(name);

    if (conflictingConfigurationIndex >= 0) {
        const result = await onConflict(name, targetName => Promise.resolve(getConflictingIndex(targetName) === -1));

        switch (result.type) {
            case 'overwrite':
                configurationIndex = conflictingConfigurationIndex;
                break;
            case 'rename':
                name = result.name;
                break;
            case 'skip':
                return undefined;
        }
    }

    const configuration = contentFactory(name);

    if (configurationIndex !== undefined) {
        workspaceConfigurations[configurationIndex] = configuration;
    } else {
        workspaceConfigurations.push(configuration);
    }

    await workspaceConfiguration.update('configurations', workspaceConfigurations, vscode.ConfigurationTarget.WorkspaceFolder);

    return name;
}