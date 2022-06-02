// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fs from 'fs/promises';
import * as vscode from 'vscode';
import scaffoldConfiguration, { ConfigurationContentFactory } from './configurationScaffolder';
import scaffoldTask, { TaskContentFactory } from './taskScaffolder';
import { ConflictHandler } from './conflicts';

export type FileContentFactory = (path: string) => Promise<string>;

export interface Scaffolder {
    scaffoldConfiguration(name: string, folder: vscode.WorkspaceFolder, contentFactory: ConfigurationContentFactory, onConflict: ConflictHandler): Promise<string | undefined>;
    scaffoldFile(path: string, contentFactory: FileContentFactory, onConflict: ConflictHandler): Promise<string | undefined>;
    scaffoldTask(label: string, folder: vscode.WorkspaceFolder, contentFactory: TaskContentFactory, onConflict: ConflictHandler): Promise<string | undefined>;
}

async function pathExists(path: string): Promise<boolean> {
    try {
        await fs.stat(path);

        return true;
    } catch {
        return false;
    }
}

export default class LocalScaffolder implements Scaffolder {
    scaffoldConfiguration(name: string, folder: vscode.WorkspaceFolder, contentFactory: ConfigurationContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
        return scaffoldConfiguration(name, folder, contentFactory, onConflict);
    }

    async scaffoldFile(path: string, contentFactory: FileContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
        if (await pathExists(path)) {
            const result = await onConflict(path, async targetPath => !(await pathExists(targetPath)));

            switch (result.type) {
                case 'rename':
                    path = result.name;
                    break;
                case 'skip':
                    return undefined;
            }
        }

        const content = await contentFactory(path);

        await fs.writeFile(path, content, 'utf8');

        return path;
    }

    scaffoldTask(label: string, folder: vscode.WorkspaceFolder, contentFactory: TaskContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
        return scaffoldTask(label, folder, contentFactory, onConflict);
    }
}