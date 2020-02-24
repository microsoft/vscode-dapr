// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { IActionContext } from "vscode-azureextensionui";
import { UserInput } from '../../services/userInput';

export function readDocumentation(context: IActionContext, ui: UserInput): Thenable<boolean> {
    return vscode.env.openExternal(vscode.Uri.parse('https://aka.ms/vscode-dapr-help-read-documentation', true));
}

const createReadDocumentationCommand = (ui: UserInput) => (context: IActionContext): Thenable<boolean> => readDocumentation(context, ui);

export default createReadDocumentationCommand;
