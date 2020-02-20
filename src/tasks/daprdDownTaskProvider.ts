// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as psList from 'ps-list';
import CustomExecutionTaskProvider from "./customExecutionTaskProvider";
import { TaskDefinition } from './taskDefinition';
import { localize } from '../util/localize';
import { TelemetryProvider } from '../services/telemetryProvider';

export interface DaprdDownTaskDefinition extends TaskDefinition {
    appId?: string;
    type: 'daprd-down';
}

export default class DaprdDownTaskProvider extends CustomExecutionTaskProvider {
    constructor(telemetryProvider: TelemetryProvider) {
        super(
            (definition, writer) => {
                return telemetryProvider.callWithTelemetry(
                    'vscode-dapr.tasks.dapr-down',
                    async () => {
                        const daprdDownDefinition = definition as DaprdDownTaskDefinition;
                        
                        if (daprdDownDefinition.appId === undefined) {
                            throw new Error(localize('tasks.daprdDownTaskProvider.appIdError', 'The \'appId\' property must be set.'));
                        }
                        
                        const processes = await psList();
                        const daprdProcesses = processes.filter(p => p.name === 'daprd');
                        
                        const argumentPattern = `--dapr-id ${daprdDownDefinition.appId}`;
                        
                        const appProcesses = daprdProcesses.filter(p => p.cmd?.includes(argumentPattern));
                        
                        appProcesses.forEach(p => process.kill(p.pid, 'SIGKILL'));
                        
                        writer.writeLine(localize('tasks.daprdDownTaskProvider.shutdownMessage', 'Shutting down daprd...'));
                    });
            },
            /* isBackgroundTask: */ false,
            /* problemMatchers: */ []);
    }
}