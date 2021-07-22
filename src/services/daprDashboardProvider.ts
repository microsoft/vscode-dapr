// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import portfinder = require('portfinder');
import * as vscode from 'vscode';
import {Process} from '../util/process'
export interface DaprDashboardProvider {
    startDashboard(): Promise<vscode.Uri>;
}

export default class ClassBasedDaprDashboardProvider implements DaprDashboardProvider {
    private port:number | undefined;
    private daprPath: string
    private process = new Process();
    constructor(daprPath: string) {
        this.daprPath = daprPath;
    }


    async startDashboard(): Promise<vscode.Uri> {
        await this.spawnDashboardInstance();
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return vscode.Uri.parse(`http://localhost:${this.getPortUsed()}`)
    }


    async spawnDashboardInstance(): Promise<void>{
        if (this.port != undefined) {
            return;
        }
        await this.findOpenPort();
        await this.processSpawn();
    }

    async findOpenPort(): Promise<void> {
        await portfinder.getPortPromise()
        .then((port) => {
            this.port = port;
        })
        .catch((err) => {
            console.log(err);
            this.port = 50505;
        });
    }

    async processSpawn() : Promise<void>{
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        await this.process.spawn(`${this.getDaprPath()} dashboard -p ${this.getPortUsed()}`)
    }
    

    private getPortUsed(): number | undefined {
        return this.port;
    }

    setDaprPath(daprPath: string): void {
        this.daprPath = daprPath;
    }

    getDaprPath(): string {
        return this.daprPath;
    }
}