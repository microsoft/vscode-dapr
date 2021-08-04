// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as portfinder from 'portfinder'
import {Process} from '../util/process'
import * as nls from 'vscode-nls'
import { getLocalizationPathForFile } from '../util/localization';
import * as tcp from 'tcp-port-used'

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));


export interface DaprDashboardProvider {
    startDashboard(): Promise<string>;
}

export default class ProcessBasedDaprDashboardProvider implements DaprDashboardProvider {
    private port: number | undefined;
    private openPort: number | undefined
    constructor(private readonly daprPathProvider: () => string) {
    }


    async startDashboard(): Promise<string> {
        if(this.port === undefined) {
            await this.spawnDashboardInstance();

            if(this.openPort !== undefined) {
                await tcp.waitForStatus(this.openPort, 'localhost', true, 500, 4000).then(() => {
                    this.port = this.openPort; //store port value if localhost port connection is successful
                }, (err) => {
                    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                    const msg = err + localize('dashboard.startDashboard.statusTimeout', ': unable to connect to localhost port ') + this.openPort?.toString();
                    throw new Error(msg)
                });
            }   
        }

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `http://localhost:${this.port}`;
    }

    async spawnDashboardInstance(): Promise<void>{
        this.openPort = await this.findOpenPort();
        void Process.exec(`${this.daprPathProvider()} dashboard -p ${this.openPort}`)
            .catch(() => {
                throw new Error(localize('dashboard.spawnDashboard.spawnFailure', 'Dashboard process failed to spawn'))
            })
        
        return;
    }

    async findOpenPort(): Promise<number> {
        return await portfinder.getPortPromise().catch(() => {
            throw new Error(localize('dashboard.findOpenPort.noOpenPort', 'No open port found.'))
        });
    }

}