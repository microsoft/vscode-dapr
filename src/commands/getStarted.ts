// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export function getStarted(): Thenable<boolean> {
    // TODO: Create aka.ms link to wiki?
    return vscode.env.openExternal(vscode.Uri.parse('https://github.com/microsoft/vscode-dapr', true));
}

const createGetStartedCommand = () => (): Thenable<boolean> => getStarted();

export default createGetStartedCommand;
