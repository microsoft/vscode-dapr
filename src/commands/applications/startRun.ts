// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { getLocalizationPathForFile } from '../../util/localization';
import * as nls from 'vscode-nls';
import * as path from 'path';
import * as vscode from 'vscode';
import DaprCommandTaskProvider, { DaprTaskDefinition } from '../../tasks/daprCommandTaskProvider';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export async function startRun(runTemplateFile: string, taskProvider: DaprCommandTaskProvider): Promise<void> {
    const taskDefinition: DaprTaskDefinition = {
        type: 'dapr',
        runFile: runTemplateFile
    };

    const runFileName = path.basename(path.dirname(runTemplateFile));

    const resolvedTask = await taskProvider.resolveTask(
        new vscode.Task(
            taskDefinition,
            vscode.TaskScope.Workspace,
            runFileName,
            "Dapr"));

    if (!resolvedTask) {
        throw new Error(localize('commands.applications.startRun.unresolvedTask', 'Unable to resolve a task for the dapr run.'));
    }

    await vscode.tasks.executeTask(resolvedTask);
}

const createStartRunCommand = (taskProvider: DaprCommandTaskProvider) => (context: IActionContext, uri: vscode.Uri): Promise<void> => {
    const folder = vscode.workspace.workspaceFolders?.[0];

    if (folder === undefined) {
        throw new Error(localize('commands.applications.startRun.noWorkspaceFolder', 'Starting a Dapr run requires an open workspace.'));
    }

    return startRun(uri.fsPath, taskProvider);
}

export default createStartRunCommand;
