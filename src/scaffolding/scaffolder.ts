// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fse from 'fs-extra';
import scaffoldConfiguration, { ConfigurationContentFactory } from './configurationScaffolder';
import scaffoldTask, { TaskContentFactory } from './taskScaffolder';
import { ConflictHandler } from './conflicts';

export type FileContentFactory = (path: string) => Promise<string>;

export interface Scaffolder {
    scaffoldConfiguration(name: string, contentFactory: ConfigurationContentFactory, onConflict: ConflictHandler): Promise<string | undefined>;
    scaffoldFile(path: string, contentFactory: FileContentFactory, onConflict: ConflictHandler): Promise<string | undefined>;
    scaffoldTask(label: string, contentFactory: TaskContentFactory, onConflict: ConflictHandler): Promise<string | undefined>;
}

export default class LocalScaffolder implements Scaffolder {
    scaffoldConfiguration(name: string, contentFactory: ConfigurationContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
        return scaffoldConfiguration(name, contentFactory, onConflict);
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

    scaffoldTask(label: string, contentFactory: TaskContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
        return scaffoldTask(label, contentFactory, onConflict);
    }
}