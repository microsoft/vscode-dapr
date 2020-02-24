// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IActionContext } from "vscode-azureextensionui";
import { UserInput } from '../../services/userInput';

export function browseDocumentation(context: IActionContext, ui: UserInput): void {
    return undefined;
}

const createBrowseDocumentationCommand = (ui: UserInput) => (context: IActionContext): void => browseDocumentation(context, ui);

export default createBrowseDocumentationCommand;
