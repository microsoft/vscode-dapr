// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { UserInput } from '../../services/userInput';

export function installDapr(ui: UserInput): Thenable<boolean> {
    return ui.openExternal('https://aka.ms/vscode-dapr-install-dapr');
}

const createInstallDaprCommand = (ui: UserInput) => (): Thenable<boolean> => installDapr(ui);

export default createInstallDaprCommand;
