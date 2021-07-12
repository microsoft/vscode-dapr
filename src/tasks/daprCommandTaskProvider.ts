// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import CommandLineBuilder from '../util/commandLineBuilder';
import CommandTaskProvider from './commandTaskProvider';
import { TaskDefinition } from './taskDefinition';
import { TelemetryProvider } from '../services/telemetryProvider';
import { IActionContext } from 'vscode-azureextensionui';
import { DaprInstallationManager } from '../services/daprInstallationManager';

export interface DaprTaskDefinition extends TaskDefinition {
    appId?: string;
    appMaxConcurrency?: number;
    appPort?: number;
    appProtocol?: 'grpc' | 'http';
    appSsl?: boolean;
    args?: string[];
    command?: string[];
    componentsPath?: string;
    config?: string;
    cwd?: string;
    enableProfiling?: boolean;
    grpcPort?: number;
    httpPort?: number;
    logLevel?: 'debug' | 'info' | 'warning' | 'error' | 'fatal' | 'panic';
    placementHostAddress?: string;
    profilePort?: number;
    type: 'daprd';
}

export default class DaprCommandTaskProvider extends CommandTaskProvider {
    constructor(daprInstallationManager: DaprInstallationManager, daprPathProvider: () => string, telemetryProvider: TelemetryProvider) {
        super(
            (definition, callback) => {
                return telemetryProvider.callWithTelemetry(
                    'vscode-dapr.tasks.dapr',
                    async (context: IActionContext) => {
                        await daprInstallationManager.ensureInitialized(context.errorHandling);

                        const daprDefinition = definition as DaprTaskDefinition;
                        
                        const command =
                            CommandLineBuilder
                                .create(daprPathProvider(), 'run')
                                .withNamedArg('--app-id', daprDefinition.appId)
                                .withNamedArg('--app-max-concurrency', daprDefinition.appMaxConcurrency)
                                .withNamedArg('--app-port', daprDefinition.appPort)
                                .withNamedArg('--app-protocol', daprDefinition.appProtocol)
                                .withNamedArg('--app-ssl', daprDefinition.appSsl, { assignValue: true })
                                .withNamedArg('--components-path', daprDefinition.componentsPath)
                                .withNamedArg('--config', daprDefinition.config)
                                .withNamedArg('--dapr-grpc-port', daprDefinition.grpcPort)
                                .withNamedArg('--dapr-http-port', daprDefinition.httpPort)
                                .withNamedArg('--enable-profiling', daprDefinition.enableProfiling, { assignValue: true })
                                .withNamedArg('--log-level', daprDefinition.logLevel)
                                .withNamedArg('--placement-host-address', daprDefinition.placementHostAddress)
                                .withNamedArg('--profile-port', daprDefinition.profilePort)
                                .withArgs(daprDefinition.args)
                                .withArgs(daprDefinition.command)
                                .build();
                        
                        return callback(command, { cwd: definition.cwd });
                    });
            },
            /* isBackgroundTask: */ true,
            /* problemMatchers: */ ['$dapr']);
    }
}