// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AsyncDisposable } from '../util/asyncDisposable';
import { DaprCliClient, DaprDashboard } from './daprCliClient';

export interface DaprDashboardProvider {
    startDashboard(): Promise<string>;
}

export default class DaprBasedDaprDashboardProvider implements DaprDashboardProvider, AsyncDisposable {
    private dashboardTask: Promise<DaprDashboard> | undefined;

    constructor(private readonly daprCliClient: DaprCliClient) {
    }

    async dispose() {
        if (this.dashboardTask) {
            const dashboard = await this.dashboardTask;

            await dashboard.dispose();
        }
    }

    async startDashboard(): Promise<string> {
        if (this.dashboardTask === undefined) {
            this.dashboardTask = this.daprCliClient.startDashboard();
        }

        const dashboard = await this.dashboardTask;

        return dashboard.url;
    }
}
