// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { DaprCliClient } from './daprCliClient';

export interface DaprDashboardProvider {
    startDashboard(): Promise<string>;
}

export default class DaprBasedDaprDashboardProvider extends vscode.Disposable implements DaprDashboardProvider {
    private dashboardTask: Promise<string> | undefined;
    private readonly tokenProvider = new vscode.CancellationTokenSource();

    constructor(private readonly daprCliClient: DaprCliClient) {
        super(
            () => {
                this.tokenProvider.cancel();
                this.tokenProvider.dispose();
            });
    }

    async startDashboard(): Promise<string> {
        if (this.dashboardTask === undefined) {
            this.dashboardTask = this.daprCliClient.startDashboard(this.tokenProvider.token);
        }

        return await this.dashboardTask;
    }
}
