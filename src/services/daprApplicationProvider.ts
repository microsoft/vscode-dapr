// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import CommandLineBuilder from '../util/commandLineBuilder';
import { Process } from '../util/process';
import Timer from '../util/timer';

export interface DaprApplication {
    appId: string;
    httpPort: number;
    pid: number;
    grpcPort: number;
    appPort: number | undefined;
    ppid: number | undefined;
    runTemplatePath?: string; // Avaliable only for v1.10+
}

export interface DaprApplicationProvider {
    readonly onDidChange: vscode.Event<void>;

    getApplications(): Promise<DaprApplication[]>;
}

interface DaprListApplication {
    appId: string;
    httpPort: number;
    grpcPort: number;
    appPort: number;
    metricsEnabled: boolean;
    command: string;
    age: string;
    created: string;
    daprdPid: number;
    cliPid: number;
    maxRequestBodySize: number;
    httpReadBufferSize: number;
    runTemplatePath?: string; // Avaliable only for v1.10+
}

export default class DaprListBasedDaprApplicationProvider extends vscode.Disposable implements DaprApplicationProvider {
    private applications: DaprApplication[] | undefined;
    private currentRefresh: Promise<void> | undefined;
    private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();
    private readonly timer: vscode.Disposable;

    constructor(private readonly daprPathProvider: () => string) {
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
        const command =
            CommandLineBuilder
                .create(this.daprPathProvider(), 'list')
                .withNamedArg('--output', 'json')
                .build();

        const result = await Process.exec(command);

        if (result.code != 0) {
            throw new Error(`'${command}' failed with exit code ${result.code}.`);
        }

        const applicationsJson = result.stdout;

        // NOTE: `dapr list --output json` returns inconsistent JSON (dapr/cli#1171)
        let applications = JSON.parse(applicationsJson) as (DaprListApplication[] | DaprListApplication);

        if (!Array.isArray(applications)) {
            applications = [ applications ];
        }

        this.applications =
            applications.map(application => ({
                appId: application.appId,
                appPort: application.appPort,
                grpcPort: application.grpcPort,
                httpPort: application.httpPort,
                pid: application.daprdPid,
                ppid: application.cliPid,
                runTemplatePath: application.runTemplatePath
            }))
        
        this.onDidChangeEmitter.fire();
    }
}
