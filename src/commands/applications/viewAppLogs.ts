// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import { IActionContext } from '@microsoft/vscode-azext-utils';
import { getLocalizationPathForFile } from '../../util/localization';
import * as nls from 'vscode-nls';
import * as path from 'path';
import * as vscode from 'vscode';
import { DaprApplication } from "../../services/daprApplicationProvider";
import { fromRunFilePath, getAppId } from "../../util/runFileReader";

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

function getTimestamp(file: vscode.Uri): string {
    const filePath = file.fsPath;
    const fileName = path.basename(filePath);

    const splitFileName = fileName.split('_');

    if (splitFileName.length < 3) {
        throw new Error(localize('commands.applications.viewAppLogs.unexpectedFileName', 'The filename \'{0}\' did not have the expected format.', filePath));
    }

    return splitFileName[2];
}

export async function viewAppLogs(application: DaprApplication): Promise<void> {
    if (!application.runTemplatePath) {
        throw new Error(localize('commands.applications.viewAppLogs.noRunFile', 'Logs can be viewed only when applications are started via a run file.'));
    }

    const runFile = await fromRunFilePath(application.runTemplatePath);

    for (const app of runFile.apps ?? []) {
        if (application.appId === getAppId(app)) {
            if (!app.appDirPath) {
                throw new Error(localize('commands.applications.viewAppLogs.appDirNotFound', 'The directory for application \'{0}\' was not found in the run file \'{1}\'.', application.appId, application.runTemplatePath));
            }
            const runFileDirectory = path.dirname(application.runTemplatePath);
            const appDirectory = path.join(runFileDirectory, app.appDirPath, '.dapr', 'logs');

            const pattern = `${application.appId}_app_*.log`;
            const relativePattern = new vscode.RelativePattern(appDirectory, pattern);

            const files = await vscode.workspace.findFiles(relativePattern);

            const timestampedFiles = files.map(file => ({ file: file, timestamp: getTimestamp(file) }))

            timestampedFiles.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

            if (timestampedFiles.length < 1) {
                throw new Error(localize('commands.applications.viewAppLogs.logNotFound', 'No logs for application \'{0}\' were.', application.appId));
            }

            const logFile = timestampedFiles[0].file;

            // TODO: Scroll to end.
            await vscode.window.showTextDocument(logFile);

            return;
        }
    }

    throw new Error(localize('commands.applications.viewAppLogs.appNotFound', 'The application \'{0}\' was not found in the run file \'{1}\'.', application.appId, application.runTemplatePath));
}

const createViewAppLogsCommand = () => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => {
    if (node == undefined) {
        throw new Error(localize('commands.applications.viewAppLogs.noPaletteSupport', 'Viewing logs requires selecting an application in the Dapr view.'));
    }

    return viewAppLogs(node.application);
}

export default createViewAppLogsCommand;
