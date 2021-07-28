/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as portfinder from 'portfinder'
import * as vscode from 'vscode';
import {Process} from '../util/process'
import * as nls from 'vscode-nls'
import { getLocalizationPathForFile } from '../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));


export interface DaprDashboardProvider {
    startDashboard(): Promise<string>;
}

export default class ClassBasedDaprDashboardProvider implements DaprDashboardProvider {
    private port:number | undefined;
    private daprPath: string
    private process = new Process();
    constructor(daprPath: string) {
        this.daprPath = daprPath;
    }


    async startDashboard(): Promise<string> {
        console.log('here');
        await this.spawnDashboardInstance();
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `http://localhost:${this.getPortUsed()}`
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
        .then((port: number | undefined) => {
            this.port = port;
        })
        .catch(() => {
           throw new Error(localize('dashboard.findOpenPort.noOpenPort', 'No open port found.'))
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