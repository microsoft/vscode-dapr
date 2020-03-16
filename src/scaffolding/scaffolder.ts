import * as vscode from 'vscode';
import scaffoldConfiguration, { DebugConfiguration } from './configurationScaffolder';
import { TaskDefinition } from '../tasks/taskDefinition';
import scaffoldTask from './taskScaffolder';

export interface Scaffolder {
    scaffoldConfiguration(label: string, contentFactory: () => DebugConfiguration, onConflict: (configuration: DebugConfiguration) => Promise<boolean>): Promise<string | undefined>;
    scaffoldFile(fileName: string, contentFactory: () => string, onConflict: (fileName: string) => Promise<boolean>): Promise<string | undefined>;
    scaffoldTask(label: string, contentFactory: () => TaskDefinition, onConflict: (task: TaskDefinition) => Promise<boolean>): Promise<string | undefined>;
}

export default class LocalScaffolder implements Scaffolder {
    async scaffoldConfiguration(label: string, contentFactory: () => DebugConfiguration, onConflict: (configuration: DebugConfiguration) => Promise<boolean>): Promise<string | undefined> {
        const content = contentFactory();
        
        if (await scaffoldConfiguration(content, onConflict)) {
            return label;
        }

        return undefined;
    }

    scaffoldFile(fileName: string, contentFactory: () => string, onConflict: (fileName: string) => Promise<boolean>): Promise<string | undefined> {
        return Promise.resolve(undefined);
    }

    async scaffoldTask(label: string, contentFactory: () => vscode.TaskDefinition, onConflict: (task: TaskDefinition) => Promise<boolean>): Promise<string | undefined> {
        const content = contentFactory();

        if (await scaffoldTask(content, onConflict)) {
            return label;
        }

        return undefined;
    }
}