import * as vscode from 'vscode';
import scaffoldConfiguration, { DebugConfiguration } from './configurationScaffolder';
import { TaskDefinition } from '../tasks/taskDefinition';
import scaffoldTask from './taskScaffolder';

export interface Scaffolder {
    scaffoldConfiguration(name: string, contentFactory: (name: string) => DebugConfiguration, onConflict: (configuration: DebugConfiguration) => Promise<boolean>): Promise<string | undefined>;
    scaffoldFile(fileName: string, contentFactory: (fileName: string) => string, onConflict: (fileName: string) => Promise<boolean>): Promise<string | undefined>;
    scaffoldTask(label: string, contentFactory: (label: string) => TaskDefinition, onConflict: (task: TaskDefinition) => Promise<boolean>): Promise<string | undefined>;
}

export default class LocalScaffolder implements Scaffolder {
    async scaffoldConfiguration(name: string, contentFactory: (name: string) => DebugConfiguration, onConflict: (configuration: DebugConfiguration) => Promise<boolean>): Promise<string | undefined> {
        const content = contentFactory(name);
        
        if (await scaffoldConfiguration(content, onConflict)) {
            return name;
        }

        return undefined;
    }

    scaffoldFile(fileName: string, contentFactory: (fileName: string) => string, onConflict: (fileName: string) => Promise<boolean>): Promise<string | undefined> {
        return Promise.resolve(undefined);
    }

    async scaffoldTask(label: string, contentFactory: (label: string) => vscode.TaskDefinition, onConflict: (task: TaskDefinition) => Promise<boolean>): Promise<string | undefined> {
        const content = contentFactory(label);

        if (await scaffoldTask(content, onConflict)) {
            return label;
        }

        return undefined;
    }
}