import * as cp from 'child_process';
import * as vscode from 'vscode';
import CustomExecutionTaskProvider from "./customExecutionTaskProvider";
import { Process } from '../util/process';

export type CommandTaskSpawnCallback = (command: string, options?: cp.SpawnOptions) => Promise<void>;
export type CommandTaskProviderCallback = (definition: vscode.TaskDefinition, callback: CommandTaskSpawnCallback, token?: vscode.CancellationToken) => Promise<void>;

export default class CommandTaskProvider extends CustomExecutionTaskProvider {
    constructor(callback: CommandTaskProviderCallback) {
        super(
            (definition, writer, token) => {
                return callback(
                    definition,
                    async (command, options) => {
                        const process = new Process();

                        try {
                            process.onStdErr(
                                data => {
                                    writer.write(data);
                                });
        
                            process.onStdOut(
                                data => {
                                    writer.write(data);
                                });
        
                            const spawnOptions = options || {};
        
                            if (spawnOptions.cwd === undefined) {
                                if (vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 0) {
                                    throw new Error('If no current working directory is set, you must open a workspace before running a Dapr task.');
                                }
        
                                spawnOptions.cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
                            }
        
                            await process.spawn(command, spawnOptions, token);
                        } finally {
                            process.dispose();
                        }        
                    },
                    token);
            });
    }
}