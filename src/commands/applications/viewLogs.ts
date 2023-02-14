// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as nls from 'vscode-nls';
import * as path from 'path';
import * as vscode from 'vscode';
import { getLocalizationPathForFile } from '../../util/localization';
import { DaprApplication } from "../../services/daprApplicationProvider";
import { fromRunFilePath, getAppId } from "../../util/runFileReader";

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export type DaprLogType = 'app' | 'daprd';

export async function viewLogs(application: DaprApplication, type: DaprLogType): Promise<void> {
    if (!application.runTemplatePath) {
        throw new Error(localize('commands.applications.viewLogs.noRunFile', 'Logs can be viewed only when applications are started via a run file.'));
    }

    const runFile = await fromRunFilePath(vscode.Uri.file(application.runTemplatePath));

    const runFileApplication = (runFile.apps ?? []).find(app => application.appId === getAppId(app));

    if (!runFileApplication) {
        throw new Error(localize('commands.applications.viewLogs.appNotFound', 'The application \'{0}\' was not found in the run file \'{1}\'.', application.appId, application.runTemplatePath));
    }

    if (!runFileApplication.appDirPath) {
        throw new Error(localize('commands.applications.viewLogs.appDirNotFound', 'The directory for application \'{0}\' was not found in the run file \'{1}\'.', application.appId, application.runTemplatePath));
    }

    const runFileDirectory = path.dirname(application.runTemplatePath);
    const appDirectory = path.join(runFileDirectory, runFileApplication.appDirPath, '.dapr', 'logs');

    const pattern = `${application.appId}_${type}_*.log`;
    const relativePattern = new vscode.RelativePattern(appDirectory, pattern);

    const files = await vscode.workspace.findFiles(relativePattern);

    if (files.length === 0) {
        throw new Error(localize('commands.applications.viewLogs.logNotFound', 'No logs for application \'{0}\' were found.', application.appId));
    }

    const newestFile = files.reduce((newestFile, nextFile) => newestFile.fsPath.localeCompare(nextFile.fsPath) < 0 ? nextFile : newestFile);

    // TODO: Scroll to end.
    await vscode.window.showTextDocument(newestFile);
}
