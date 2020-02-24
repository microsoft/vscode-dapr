// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IActionContext } from "vscode-azureextensionui";
import { UserInput } from '../../services/userInput';

export function readDocumentation(context: IActionContext, ui: UserInput): void {
    return undefined;
}

const createReadDocumentationCommand = (ui: UserInput) => (context: IActionContext): void => readDocumentation(context, ui);

export default createReadDocumentationCommand;
