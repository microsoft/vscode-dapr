// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { UserInput } from '../../services/userInput';

export function readDocumentation(ui: UserInput): Thenable<boolean> {
    return ui.openExternal('https://aka.ms/vscode-dapr-help-read-documentation');
}

const createReadDocumentationCommand = (ui: UserInput) => (): Thenable<boolean> => readDocumentation(ui);

export default createReadDocumentationCommand;
