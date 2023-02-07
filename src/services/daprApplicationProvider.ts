// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { distinctUntilChanged, Observable, shareReplay, switchMap, timer } from 'rxjs';
import CommandLineBuilder from '../util/commandLineBuilder';
import { Process } from '../util/process';
import isequal from 'lodash.isequal';

export interface DaprApplication {
    appId: string;
    appPid?: number; // Available only for v1.10+
    command: string;
    httpPort: number;
    pid: number;
    grpcPort: number;
    appPort: number | undefined;
    ppid: number | undefined;
    runTemplatePath?: string; // Avaliable only for v1.10+
}

export interface DaprApplicationProvider {
    readonly applications: Observable<DaprApplication[]>;
}

interface DaprListApplication {
    appId: string;
    appPid?: number; // Aavailable only for v1.10+
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

export default class DaprListBasedDaprApplicationProvider implements DaprApplicationProvider {
    constructor(private readonly daprPathProvider: () => string) {
        this.applications =
            timer(0, 2000)
                .pipe(
                    switchMap(() => this.getApplications()),
                    distinctUntilChanged(isequal),
                    shareReplay(1)
                );
    }

    public readonly applications: Observable<DaprApplication[]>;

    async getApplications(): Promise<DaprApplication[]> {
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

        return applications
            .map(application => ({
                appId: application.appId,
                appPid: application.appPid !== 0 ? application.appPid : undefined,
                appPort: application.appPort,
                command: application.command,
                grpcPort: application.grpcPort,
                httpPort: application.httpPort,
                pid: application.daprdPid,
                ppid: application.cliPid,
                runTemplatePath: application.runTemplatePath
            }))
            .sort((a, b) => a.appId.localeCompare(b.appId))
    }
}
