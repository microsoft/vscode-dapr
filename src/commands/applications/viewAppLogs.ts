// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as nls from 'vscode-nls';
import * as path from 'path';
import * as vscode from 'vscode';
import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import { IActionContext } from '@microsoft/vscode-azext-utils';
import { getLocalizationPathForFile } from '../../util/localization';
import { DaprApplication } from "../../services/daprApplicationProvider";
import { fromRunFilePath, getAppId } from "../../util/runFileReader";

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export async function viewAppLogs(application: DaprApplication): Promise<void> {
    if (!application.runTemplatePath) {
        throw new Error(localize('commands.applications.viewAppLogs.noRunFile', 'Logs can be viewed only when applications are started via a run file.'));
    }

    const runFile = await fromRunFilePath(application.runTemplatePath);

    const runFileApplication = (runFile.apps ?? []).find(app => application.appId === getAppId(app));

    if (!runFileApplication) {
        throw new Error(localize('commands.applications.viewAppLogs.appNotFound', 'The application \'{0}\' was not found in the run file \'{1}\'.', application.appId, application.runTemplatePath));
    }

    if (!runFileApplication.appDirPath) {
        throw new Error(localize('commands.applications.viewAppLogs.appDirNotFound', 'The directory for application \'{0}\' was not found in the run file \'{1}\'.', application.appId, application.runTemplatePath));
    }

    const runFileDirectory = path.dirname(application.runTemplatePath);
    const appDirectory = path.join(runFileDirectory, runFileApplication.appDirPath, '.dapr', 'logs');

    const pattern = `${application.appId}_app_*.log`;
    const relativePattern = new vscode.RelativePattern(appDirectory, pattern);

    const files = await vscode.workspace.findFiles(relativePattern);

    if (files.length === 0) {
        throw new Error(localize('commands.applications.viewAppLogs.logNotFound', 'No logs for application \'{0}\' were found.', application.appId));
    }

    const newestFile = files.reduce((newestFile, nextFile) => newestFile.fsPath.localeCompare(nextFile.fsPath) < 0 ? nextFile : newestFile);

    // TODO: Scroll to end.
    await vscode.window.showTextDocument(newestFile);
}

const createViewAppLogsCommand = () => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => {
    if (node == undefined) {
        throw new Error(localize('commands.applications.viewAppLogs.noPaletteSupport', 'Viewing logs requires selecting an application in the Dapr view.'));
    }

    return viewAppLogs(node.application);
}

export default createViewAppLogsCommand;
