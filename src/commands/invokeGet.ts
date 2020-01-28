import * as vscode from 'vscode';
import DaprApplicationNode from "../views/applications/daprApplicationNode";
import { DaprApplicationProvider } from "../services/daprApplicationProvider";
import { UserInput } from '../services/userInput';
import { DaprClient } from '../services/daprClient';
import { invoke } from './invokeCommon';

export async function invokeGet(daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, node: DaprApplicationNode | undefined): Promise<void> {
    return invoke(daprApplicationProvider, daprClient, outputChannel, ui, node?.application);
}

const createInvokeGetCommand = (daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput) => (node: DaprApplicationNode | undefined): Promise<void> => invokeGet(daprApplicationProvider, daprClient, outputChannel, ui, node);

export default createInvokeGetCommand;