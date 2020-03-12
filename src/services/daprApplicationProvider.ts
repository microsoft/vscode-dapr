// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import Timer from '../util/timer';
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
        const processes = await this.processProvider.listProcesses('daprd');
        
        this.applications = processes
            .map(process => toApplication(process.cmd, process.pid))
            .filter((application): application is DaprApplication => application !== undefined);
        
        this.onDidChangeEmitter.fire();
    }
}
