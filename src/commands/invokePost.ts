// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import DaprApplicationNode from "../views/applications/daprApplicationNode";
import { DaprApplicationProvider } from "../services/daprApplicationProvider";
import { UserInput } from '../services/userInput';
import { DaprClient } from '../services/daprClient';
import { invoke } from './invokeCommon';

export async function invokePost(daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento, node: DaprApplicationNode | undefined): Promise<void> {
    return invoke(daprApplicationProvider, daprClient, outputChannel, ui, workspaceState, node?.application, /* isPost: */ true);
}

const createInvokePostCommand = (daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento) => (node: DaprApplicationNode | undefined): Promise<void> => invokePost(daprApplicationProvider, daprClient, outputChannel, ui, workspaceState, node);

export default createInvokePostCommand;
