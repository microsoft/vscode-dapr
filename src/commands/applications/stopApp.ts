// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import { UserInput } from '../../services/userInput';
import { DaprClient } from '../../services/daprClient';
import { IActionContext } from 'vscode-azureextensionui';

export async function stopApp(daprClient: DaprClient, ui: UserInput, node: DaprApplicationNode | undefined): Promise<void> {  
    return await daprClient.stopApp(node?.application, ui);
}

const createStopCommand = (daprClient: DaprClient, ui: UserInput) => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => stopApp(daprClient, ui, node);

export default createStopCommand;