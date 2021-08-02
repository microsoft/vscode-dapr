// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as vscode from 'vscode';
import ClassBasedDaprDashboardProvider from '../services/daprDashboardProvider';
import { UserInput } from '../services/userInput';


export async function openDaprDashboard(ui: UserInput, classBasedDaprDashboardProvider: ClassBasedDaprDashboardProvider): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    await vscode.env.openExternal(vscode.Uri.parse(await classBasedDaprDashboardProvider.startDashboard()));
}

const createOpenDaprDashboardCommand = (ui: UserInput, classBasedDaprDashboardProvider: ClassBasedDaprDashboardProvider) => (): Promise<void> => openDaprDashboard(ui, classBasedDaprDashboardProvider);
export default createOpenDaprDashboardCommand;
