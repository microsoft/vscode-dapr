// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import CustomExecutionTaskProvider from "./customExecutionTaskProvider";
import { Process, WrittenOutputHandler } from '../util/process';
import { TaskDefinition } from './taskDefinition';
import { getLocalizationPathForFile } from '../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export type CommandTaskSpawnCallback = (command: string, options?: cp.SpawnOptions) => Promise<void>;
export type CommandTaskProviderCallback = (definition: TaskDefinition, callback: CommandTaskSpawnCallback, token?: vscode.CancellationToken) => Promise<void>;

export default class CommandTaskProvider extends CustomExecutionTaskProvider {
    constructor(
        callback: CommandTaskProviderCallback,
        isBackgroundTask?: boolean,
        problemMatchers?: string[]) {
        super(
            (definition, writer, token) => {
                return callback(
                    definition,
                    async (command, options) => {
                        const outputHandler = new WrittenOutputHandler(
                            data => writer.write(data),
                            data => writer.write(data));

                        try {
                            const spawnOptions = { ...(options ?? {}), outputHandler };

                            if (spawnOptions.cwd === undefined) {
                                if (vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 0) {
                                    throw new Error(localize('tasks.commandTaskProvider.noWorkspaceError', 'If no current working directory is set, you must open a workspace before running a Dapr task.'));
                                }

                                spawnOptions.cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
                            }

                            writer.writeLine(localize('tasks.commandTaskProvider.executingMessage', '> Executing command: {0} <', command), 'bold');
                            writer.writeLine('');

                            await Process.spawn(command, spawnOptions, token);
                        } finally {
                            outputHandler.dispose();
                        }
                    },
                    token);
            },
            isBackgroundTask,
            problemMatchers);
    }
}