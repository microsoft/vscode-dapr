// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import { DaprApplicationProvider } from "../../services/daprApplicationProvider";
import { UserInput } from '../../services/userInput';
import { DaprClient } from '../../services/daprClient';
import { stop } from './invokeCommon';
import { IActionContext } from 'vscode-azureextensionui';

export async function stopApp(context: IActionContext, daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, ui: UserInput, node: DaprApplicationNode | undefined): Promise<void> {
    return stop(context, daprApplicationProvider, daprClient, ui, node?.application);
}

const createStopCommand = (daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, ui: UserInput) => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => stopApp(context, daprApplicationProvider, daprClient, ui, node);

export default createStopCommand;