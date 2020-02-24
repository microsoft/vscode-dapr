// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export function getStarted(): Thenable<boolean> {
    return vscode.env.openExternal(vscode.Uri.parse('https://aka.ms/vscode-dapr-help-get-started', true));
}

const createGetStartedCommand = () => (): Thenable<boolean> => getStarted();

export default createGetStartedCommand;
