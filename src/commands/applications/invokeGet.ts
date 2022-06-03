// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import { DaprApplicationProvider } from "../../services/daprApplicationProvider";
import { UserInput } from '../../services/userInput';
import { DaprClient } from '../../services/daprClient';
import { invoke } from './invokeCommon';
import { IActionContext } from '@microsoft/vscode-azext-utils';

export async function invokeGet(context: IActionContext, daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento, node: DaprApplicationNode | undefined): Promise<void> {
    return invoke(context, daprApplicationProvider, daprClient, outputChannel, ui, workspaceState, node?.application);
}

const createInvokeGetCommand = (daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento) => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => invokeGet(context, daprApplicationProvider, daprClient, outputChannel, ui, workspaceState, node);

export default createInvokeGetCommand;