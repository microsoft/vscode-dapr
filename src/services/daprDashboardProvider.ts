// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as portfinder from 'portfinder'
import {Process} from '../util/process'
import * as nls from 'vscode-nls'
import { getLocalizationPathForFile } from '../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));


export interface DaprDashboardProvider {
    startDashboard(): Promise<string>;
}

export default class ClassBasedDaprDashboardProvider implements DaprDashboardProvider {
    private port: number | undefined;
    private process = new Process();
    constructor(private readonly daprPathProvider: () => string) {
    }


    async startDashboard(): Promise<string> {
        await this.spawnDashboardInstance();
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `http://localhost:${this.getPortUsed()}`
    }


    async spawnDashboardInstance(): Promise<void>{
        if (this.port != undefined) {
            return;
        }
        await this.findOpenPort();
        this.processSpawn();
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

    processSpawn() : void{
        const portNumber = this.getPortUsed();
        if(portNumber !== undefined) {
            void new Promise((_resolve, reject) => {
                void Process.exec(`${this.daprPathProvider()} dashboard -p ${portNumber}`)
                setTimeout(reject, 10 * 1000) //timeout after dashboard command is run
            }).then(undefined, err => {
                console.error('Dashboard process returned'); 
            })
        }
        return;
    }

    private getPortUsed(): number | undefined {
        return this.port;
    }

}