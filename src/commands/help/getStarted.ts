// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { UserInput } from '../../services/userInput';

export function getStarted(ui: UserInput): Thenable<boolean> {
    return ui.openExternal('https://aka.ms/vscode-dapr-help-get-started');
}

const createGetStartedCommand = (ui: UserInput) => (): Thenable<boolean> => getStarted(ui);

export default createGetStartedCommand;
