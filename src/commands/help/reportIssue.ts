// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export function reportIssue(): Thenable<void> {
    // TODO: Pull extension ID from package.json.
    return vscode.commands.executeCommand('vscode.openIssueReporter', 'ms-azuretools.vscode-dapr');
}

const createReportIssueCommand = () => (): Thenable<void> => reportIssue();

export default createReportIssueCommand;
