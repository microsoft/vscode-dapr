// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export function reviewIssues(): Thenable<boolean> {
    return vscode.env.openExternal(vscode.Uri.parse('https://aka.ms/vscode-dapr-help-review-issues', true));
}

const createReviewIssuesCommand = () => (): Thenable<boolean> => reviewIssues();

export default createReviewIssuesCommand;
