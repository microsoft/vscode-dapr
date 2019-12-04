import * as cp from 'child_process';
import * as vscode from 'vscode';
import CustomExecutionTaskProvider from "./customExecutionTaskProvider";
import { Process } from '../util/process';

export type CommandTaskSpawnCallback = (command: string, options?: cp.SpawnOptions) => Promise<void>;
export type CommandTaskProviderCallback = (definition: vscode.TaskDefinition, callback: CommandTaskSpawnCallback, token?: vscode.CancellationToken) => Promise<void>;

export default class DaprdDownTaskProvider extends CustomExecutionTaskProvider {
    constructor() {
        super(
            (definition, writer, token) => {
                writer.writeLine('Shutting down daprd...');
                return Promise.resolve();
            },
            /* isBackgroundTask: */ false,
            /* problemMatchers: */ []);
    }
}