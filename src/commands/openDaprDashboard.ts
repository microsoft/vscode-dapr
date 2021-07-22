// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as vscode from 'vscode';
import ClassBasedDaprDashboardProvider from '../services/daprDashboardProvider';


export async function openDaprDashboard( classBasedDaprDashboardProvider: ClassBasedDaprDashboardProvider): Promise<void> {

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    await vscode.env.openExternal(await classBasedDaprDashboardProvider.startDashboard());
}

const createOpenDaprDashboardCommand = ( classBasedDaprDashboardProvider: ClassBasedDaprDashboardProvider) => (): Promise<void> => openDaprDashboard( classBasedDaprDashboardProvider);
export default createOpenDaprDashboardCommand;
