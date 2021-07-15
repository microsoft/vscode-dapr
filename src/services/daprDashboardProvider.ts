// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import portfinder = require('portfinder');
import { spawn } from 'child_process';

export default class DaprDashboardProvider {
    private port:number | undefined;
    private daprPath: string

    constructor(daprPath: string) {
        portfinder.getPortPromise()
        .then((port) => {
            this.port = port;
        })
        .then(() => {
            this.spawnDashboardInstance()
        })
        .catch((err) => {
            console.log(err);
            this.port = 8080;
            this.spawnDashboardInstance()
        });
        this.daprPath = daprPath;
    }

    spawnDashboardInstance(): void {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        spawn(this.daprPath, ['dashboard', '-p', `${this.port}`]);
    }

    getPortUsed(): number | undefined {
        return this.port;
    }
}