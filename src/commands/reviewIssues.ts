// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export function reviewIssues(): Thenable<boolean> {
    // TODO: Pull URL from package.json.
    return vscode.env.openExternal(vscode.Uri.parse('https://github.com/microsoft/vscode-dapr/issues', true));
}

const createReviewIssuesCommand = () => (): Thenable<boolean> => reviewIssues();

export default createReviewIssuesCommand;
