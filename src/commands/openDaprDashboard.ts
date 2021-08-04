// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as vscode from 'vscode';
import { DaprDashboardProvider } from '../services/daprDashboardProvider';


export async function openDaprDashboard(daprDashboardProvider: DaprDashboardProvider): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    await vscode.env.openExternal(vscode.Uri.parse(await daprDashboardProvider.startDashboard()));
}

const createOpenDaprDashboardCommand = (daprDashboardProvider: DaprDashboardProvider) => (): Promise<void> => openDaprDashboard(daprDashboardProvider);
export default createOpenDaprDashboardCommand;
