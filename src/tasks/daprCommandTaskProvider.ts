// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import CommandLineBuilder from '../util/commandLineBuilder';
import CommandTaskProvider from './commandTaskProvider';
import { TaskDefinition } from './taskDefinition';
import { TelemetryProvider } from '../services/telemetryProvider';
import { IActionContext } from '@microsoft/vscode-azext-utils';
import { DaprInstallationManager } from '../services/daprInstallationManager';

export interface DaprTaskDefinition extends TaskDefinition {
    appHealthCheckPath?: string;
    appHealthProbeInterval?: number;
    appHealthProbeTimeout?: number;
    appHealthThreshold?: number;
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
    enableApiLogging?: boolean;
    enableHealthCheck?: boolean;
    enableProfiling?: boolean;
    grpcPort?: number;
    httpMaxRequestSize?: number;
    httpPort?: number;
    httpReadBufferSize?: number;
    logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'panic';
    metricsPort?: number;
    placementHostAddress?: string;
    profilePort?: number;
    runFile?: string;
    type: 'dapr';
    unixDomainSocket?: string;
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
                                .withNamedArg('--app-health-check-path', daprDefinition.appHealthCheckPath)
                                .withNamedArg('--app-health-probe-interval', daprDefinition.appHealthProbeInterval)
                                .withNamedArg('--app-health-probe-timeout', daprDefinition.appHealthProbeTimeout)
                                .withNamedArg('--app-health-threshold', daprDefinition.appHealthThreshold)
                                .withNamedArg('--app-id', daprDefinition.appId)
                                .withNamedArg('--app-max-concurrency', daprDefinition.appMaxConcurrency)
                                .withNamedArg('--app-port', daprDefinition.appPort)
                                .withNamedArg('--app-protocol', daprDefinition.appProtocol)
                                .withNamedArg('--app-ssl', daprDefinition.appSsl, { assignValue: true })
                                .withNamedArg('--components-path', daprDefinition.componentsPath)
                                .withNamedArg('--config', daprDefinition.config)
                                .withNamedArg('--dapr-grpc-port', daprDefinition.grpcPort)
                                .withNamedArg('--dapr-http-max-request-size', daprDefinition.httpMaxRequestSize)
                                .withNamedArg('--dapr-http-port', daprDefinition.httpPort)
                                .withNamedArg('--dapr-http-read-buffer-size', daprDefinition.httpReadBufferSize)
                                .withNamedArg('--enable-api-logging', daprDefinition.enableApiLogging, { assignValue: true })
                                .withNamedArg('--enable-app-health-check', daprDefinition.enableHealthCheck, { assignValue: true })
                                .withNamedArg('--enable-profiling', daprDefinition.enableProfiling, { assignValue: true })
                                .withNamedArg('--log-level', daprDefinition.logLevel)
                                .withNamedArg('--metrics-port', daprDefinition.metricsPort)
                                .withNamedArg('--placement-host-address', daprDefinition.placementHostAddress)
                                .withNamedArg('--profile-port', daprDefinition.profilePort)
                                .withNamedArg('--run-file', daprDefinition.runFile)
                                .withNamedArg('--unix-domain-socket', daprDefinition.unixDomainSocket)
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