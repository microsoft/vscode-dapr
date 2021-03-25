// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as os from 'os';
import * as path from 'path';
import CommandLineBuilder from '../util/commandLineBuilder';
import CommandTaskProvider from './commandTaskProvider';
import { TaskDefinition } from './taskDefinition';
import { TelemetryProvider } from '../services/telemetryProvider';
import { EnvironmentProvider } from '../services/environmentProvider';

type DaprdLogLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal' | 'panic';

export interface DaprdTaskDefinition extends TaskDefinition {
    allowedOrigins?: string;
    appId?: string;
    appMaxConcurrency?: number;
    appPort?: number;
    appProtocol?: 'grpc' | 'http';
    appSsl?: boolean;
    args?: string[];
    componentsPath?: string;
    config?: string;
    controlPlaneAddress?: string;
    enableProfiling?: boolean;
    enableMtls?: boolean;
    grpcPort?: number;
    httpPort?: number;
    internalGrpcPort?: number;
    kubeConfig?: string;
    logAsJson?: boolean;
    logLevel?: DaprdLogLevel;
    metricsPort?: number;
    mode?: 'standalone' | 'kubernetes';
    placementHostAddress?: string;
    profilePort?: number;
    sentryAddress?: string;
    type: 'daprd';
}

export default class DaprdCommandTaskProvider extends CommandTaskProvider {
    constructor(
        daprdPathProvider: () => string,
        environmentProvider: EnvironmentProvider,
        telemetryProvider: TelemetryProvider) {
        super(
            (definition, callback) => {
                return telemetryProvider.callWithTelemetry(
                    'vscode-dapr.tasks.daprd',
                    () => {
                        const daprDefinition = definition as DaprdTaskDefinition;
                        
                        const command =
                            CommandLineBuilder
                                .create(daprdPathProvider())
                                .withNamedArg('--allowed-origins', daprDefinition.allowedOrigins)
                                .withNamedArg('--app-id', daprDefinition.appId)
                                .withNamedArg('--app-max-concurrency', daprDefinition.appMaxConcurrency)
                                .withNamedArg('--app-port', daprDefinition.appPort)
                                .withNamedArg('--app-protocol', daprDefinition.appProtocol)
                                .withNamedArg('--app-ssl', daprDefinition.appSsl, { assignValue: true })
                                .withNamedArg('--components-path', daprDefinition.componentsPath ?? path.join(os.homedir(), '.dapr', 'components'))
                                .withNamedArg('--config', daprDefinition.config)
                                .withNamedArg('--control-plane-address', daprDefinition.controlPlaneAddress)
                                .withNamedArg('--dapr-grpc-port', daprDefinition.grpcPort)
                                .withNamedArg('--dapr-http-port', daprDefinition.httpPort)
                                .withNamedArg('--dapr-internal-grpc-port', daprDefinition.internalGrpcPort)
                                .withNamedArg('--enable-mtls', daprDefinition.enableMtls, { assignValue: true })
                                .withNamedArg('--enable-profiling', daprDefinition.enableProfiling, { assignValue: true })
                                .withNamedArg('--kubeconfig', daprDefinition.kubeConfig)
                                .withNamedArg('--log-as-json', daprDefinition.logAsJson, { assignValue: true })
                                .withNamedArg('--log-level', daprDefinition.logLevel)
                                .withNamedArg('--metrics-port', daprDefinition.metricsPort)
                                .withNamedArg('--mode', daprDefinition.mode)
                                .withNamedArg('--placement-host-address', daprDefinition.placementHostAddress ?? `${process.env.DAPR_PLACEMENT_HOST_ADDRESS ?? 'localhost'}:${environmentProvider.isWindows ? 6050 : 50005}` /* NOTE: The placement address is actually required for daprd. */)
                                .withNamedArg('--profile-port', daprDefinition.profilePort)
                                .withNamedArg('--sentry-address', daprDefinition.sentryAddress)
                                .withArgs(daprDefinition.args)
                                .build();

                        return callback(command, { cwd: definition.cwd });
                    });
            },
            /* isBackgroundTask: */ true,
            /* problemMatchers: */ ['$dapr']);
    }
}