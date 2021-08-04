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
    private startUp: Promise<number> | undefined;
    
    constructor(private readonly daprPathProvider: () => string) {
    }

    async startDashboard(): Promise<string> {
        let localStartup = this.startUp;

        if (!localStartup) {
            localStartup = new Promise(
                // eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor
                async (resolve, reject) => {
                    try {
                        const openPort = await portfinder.getPortPromise();
                        void Process.exec(`${this.daprPathProvider()} dashboard -p ${openPort}`)
                        
                        const successfulPort = await tcp.waitForStatus(openPort, 'localhost', true, 500, 4000).then(() => {
                            return openPort; 
                        });
                        
                        resolve(successfulPort);
                    } catch(error) {
                        this.startUp = undefined;
                        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                        const msg = localize('dashboard.startDashboard.startupError', 'Dashboard instance failed to start. ') + error;
                        reject(msg);
                    }
                });
                
            this.startUp = localStartup;
        }
        
        this.port = await localStartup;                
        return `http://localhost:${this.port}`;
    }

}