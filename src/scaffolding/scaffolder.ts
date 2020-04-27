// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fse from 'fs-extra';
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

export default class LocalScaffolder implements Scaffolder {
    scaffoldConfiguration(name: string, folder: vscode.WorkspaceFolder, contentFactory: ConfigurationContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
        return scaffoldConfiguration(name, folder, contentFactory, onConflict);
    }

    async scaffoldFile(path: string, contentFactory: FileContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
        if (await fse.pathExists(path)) {
            const result = await onConflict(path, async targetPath => !(await fse.pathExists(targetPath)));

            switch (result.type) {
                case 'rename':
                    path = result.name;
                    break;
                case 'skip':
                    return undefined;
            }
        }

        const content = await contentFactory(path);

        await fse.writeFile(path, content, 'utf8');

        return path;
    }

    scaffoldTask(label: string, folder: vscode.WorkspaceFolder, contentFactory: TaskContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
        return scaffoldTask(label, folder, contentFactory, onConflict);
    }
}