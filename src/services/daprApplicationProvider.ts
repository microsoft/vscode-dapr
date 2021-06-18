// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import Timer from '../util/timer';
import psList = require('ps-list');
import { ProcessProvider } from './processProvider';

export interface DaprApplication {
    appId: string;
    httpPort: number;
    pid: number;
}

export interface DaprApplicationProvider {
    readonly onDidChange: vscode.Event<void>;

    getApplications(): Promise<DaprApplication[]>;
}

function getAppId(cmd: string): string | undefined {
    const appIdRegEx = /--app-id "?(?<appId>[a-zA-Z0-9_-]+)"?/g;
        
    const appIdMatch = appIdRegEx.exec(cmd);
    
    return appIdMatch?.groups?.['appId'];
}

function getHttpPort(cmd: string): number {
    const portRegEx = /--dapr-http-port "?(?<port>\d+)"?/g;
        
    const portMatch = portRegEx.exec(cmd);
    
    const portString = portMatch?.groups?.['port'];
    
    if (portString !== undefined) {
        return parseInt(portString, 10);
    } else {
        return 3500;
    }
}

function toApplication(cmd: string | undefined, pid: number): DaprApplication | undefined {
    if (cmd) {
        const appId = getAppId(cmd);

        if (appId) {
            return {
                appId,
                httpPort: getHttpPort(cmd),
                pid
            };
        }
    }

    return undefined;
}

export default class ProcessBasedDaprApplicationProvider extends vscode.Disposable implements DaprApplicationProvider {
    private applications: DaprApplication[] | undefined;
    private currentRefresh: Promise<void> | undefined;
    private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();
    private readonly timer: vscode.Disposable;

    constructor(private readonly processProvider: ProcessProvider) {
        super(() => {
            this.timer.dispose();
            this.onDidChangeEmitter.dispose();
        });

        // TODO: Do a sane comparison of the old vs. new applications.
        this.timer = Timer.Interval(
            2000,
            () => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.refreshApplications();
            });
    }

    get onDidChange(): vscode.Event<void> {
        return this.onDidChangeEmitter.event;
    }

    async getApplications(refresh?: boolean): Promise<DaprApplication[]> {
        if (!this.applications || refresh) {
            await this.refreshApplications();
        }

        return this.applications ?? [];
    }

    private async refreshApplications(): Promise<void> {
        if (!this.currentRefresh) {
            this.currentRefresh = this.onRefresh();
        }

        await this.currentRefresh;

        this.currentRefresh = undefined;
    }

    private async onRefresh(): Promise<void> {
        const obj = await psList();
        this.applications = obj
            .map((process: psList.ProcessDescriptor) => process as ProcessInfo)
            .filter((process: ProcessInfo) => (process.cmd != undefined && process.cmd.indexOf("daprd") != -1))
            .map((process: ProcessInfo) => toApplication(process.cmd, process.pid))
            .filter((application): application is DaprApplication => application !== undefined);
        
        this.onDidChangeEmitter.fire();
    }
}

export interface ProcessInfo {
    "pid": number, 
    "ppid": number, 
    "uid": number, 
    "cpu": number,
    "memory": number, 
    "name": string,
    "cmd": string
}