// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import scaffoldConfiguration, { DebugConfiguration, ConfigurationContentFactory } from './configurationScaffolder';
import scaffoldTask, { TaskContentFactory } from './taskScaffolder';
import { ConflictHandler } from './conflicts';

export interface Scaffolder {
    scaffoldConfiguration(name: string, contentFactory: ConfigurationContentFactory, onConflict: ConflictHandler): Promise<string | undefined>;
    scaffoldFile(fileName: string, contentFactory: (fileName: string) => string, onConflict: (fileName: string) => Promise<boolean>): Promise<string | undefined>;
    scaffoldTask(label: string, contentFactory: TaskContentFactory, onConflict: ConflictHandler): Promise<string | undefined>;
}

export default class LocalScaffolder implements Scaffolder {
    scaffoldConfiguration(name: string, contentFactory: ConfigurationContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
        return scaffoldConfiguration(name, contentFactory, onConflict);
    }

    scaffoldFile(fileName: string, contentFactory: (fileName: string) => string, onConflict: (fileName: string) => Promise<boolean>): Promise<string | undefined> {
        return Promise.resolve(undefined);
    }

    scaffoldTask(label: string, contentFactory: TaskContentFactory, onConflict: ConflictHandler): Promise<string | undefined> {
        return scaffoldTask(label, contentFactory, onConflict);
    }
}