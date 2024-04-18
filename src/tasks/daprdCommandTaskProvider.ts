// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as os from 'os';
import * as path from 'path';
import CommandLineBuilder from '../util/commandLineBuilder';
import CommandTaskProvider from './commandTaskProvider';
import { TaskDefinition } from './taskDefinition';
import { TelemetryProvider } from '../services/telemetryProvider';
import { EnvironmentProvider } from '../services/environmentProvider';
import { IActionContext } from '@microsoft/vscode-azext-utils';
import { DaprInstallationManager } from '../services/daprInstallationManager';

type DaprdLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'panic';

export interface DaprdTaskDefinition extends TaskDefinition {
    allowedOrigins?: string;
    appChannelAddress?: string;
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
    componentsPath?: string;
    config?: string;
    controlPlaneAddress?: string;
    enableApiLogging?: boolean;
    enableHealthCheck?: boolean;
    enableMetrics?: boolean;
    enableMtls?: boolean;
    enableProfiling?: boolean;
    gracefulShutdownSeconds?: number;
    grpcPort?: number;
    httpMaxRequestSize?: number;
    httpPort?: number;
    httpReadBufferSize?: number;
    internalGrpcPort?: number;
    kubeConfig?: string;
    listenAddresses?: string;
    logAsJson?: boolean;
    logLevel?: DaprdLogLevel;
    metricsPort?: number;
    mode?: 'standalone' | 'kubernetes';
    placementHostAddress?: string;
    profilePort?: number;
    publicPort?: number;
    resourcesPath?: string;
    resourcesPaths?: string[];
    sentryAddress?: string;
    type: 'daprd';
    unixDomainSocket?: string;
}

export default class DaprdCommandTaskProvider extends CommandTaskProvider {
    constructor(
        daprInstallationManager: DaprInstallationManager,
        daprdPathProvider: () => string,
        environmentProvider: EnvironmentProvider,
        telemetryProvider: TelemetryProvider) {
        super(
            (definition, callback) => {
                return telemetryProvider.callWithTelemetry(
                    'vscode-dapr.tasks.daprd',
                    async (context: IActionContext) => {
                        await daprInstallationManager.ensureInitialized(context.errorHandling);

                        const daprDefinition = definition as DaprdTaskDefinition;
                        
                        const command =
                            CommandLineBuilder
                                .create(daprdPathProvider())
                                .withNamedArg('--allowed-origins', daprDefinition.allowedOrigins)
                                .withNamedArg('--app-channel-address', daprDefinition.appChannelAddress)
                                .withNamedArg('--app-health-check-path', daprDefinition.appHealthCheckPath)
                                .withNamedArg('--app-health-probe-interval', daprDefinition.appHealthProbeInterval)
                                .withNamedArg('--app-health-probe-timeout', daprDefinition.appHealthProbeTimeout)
                                .withNamedArg('--app-health-threshold', daprDefinition.appHealthThreshold)
                                .withNamedArg('--app-id', daprDefinition.appId)
                                .withNamedArg('--app-max-concurrency', daprDefinition.appMaxConcurrency)
                                .withNamedArg('--app-port', daprDefinition.appPort)
                                .withNamedArg('--app-protocol', daprDefinition.appProtocol)
                                .withNamedArg('--app-ssl', daprDefinition.appSsl, { assignValue: true })
                                .withNamedArg('--components-path', daprDefinition.componentsPath ?? path.join(os.homedir(), '.dapr', 'components'))
                                .withNamedArg('--config', daprDefinition.config)
                                .withNamedArg('--control-plane-address', daprDefinition.controlPlaneAddress)
                                .withNamedArg('--dapr-graceful-shutdown-seconds', daprDefinition.gracefulShutdownSeconds)
                                .withNamedArg('--dapr-grpc-port', daprDefinition.grpcPort)
                                .withNamedArg('--dapr-http-max-request-size', daprDefinition.httpMaxRequestSize)
                                .withNamedArg('--dapr-http-port', daprDefinition.httpPort)
                                .withNamedArg('--dapr-http-read-buffer-size', daprDefinition.httpReadBufferSize)
                                .withNamedArg('--dapr-internal-grpc-port', daprDefinition.internalGrpcPort)
                                .withNamedArg('--dapr-listen-addresses', daprDefinition.listenAddresses)
                                .withNamedArg('--dapr-public-port', daprDefinition.publicPort)
                                .withNamedArg('--enable-api-logging', daprDefinition.enableApiLogging, { assignValue: true })
                                .withNamedArg('--enable-app-health-check', daprDefinition.enableHealthCheck, { assignValue: true })
                                .withNamedArg('--enable-metrics', daprDefinition.enableMetrics, { assignValue: true })
                                .withNamedArg('--enable-mtls', daprDefinition.enableMtls, { assignValue: true })
                                .withNamedArg('--enable-profiling', daprDefinition.enableProfiling, { assignValue: true })
                                .withNamedArg('--kubeconfig', daprDefinition.kubeConfig)
                                .withNamedArg('--log-as-json', daprDefinition.logAsJson, { assignValue: true })
                                .withNamedArg('--log-level', daprDefinition.logLevel)
                                .withNamedArg('--metrics-port', daprDefinition.metricsPort)
                                .withNamedArg('--mode', daprDefinition.mode)
                                .withNamedArg('--placement-host-address', daprDefinition.placementHostAddress ?? `${process.env.DAPR_PLACEMENT_HOST_ADDRESS ?? 'localhost'}:${environmentProvider.isWindows ? 6050 : 50005}` /* NOTE: The placement address is actually required for daprd. */)
                                .withNamedArg('--profile-port', daprDefinition.profilePort)
                                .withNamedArg('--resources-path', daprDefinition.resourcesPath)
                                .withArrayArgs('--resources-path', daprDefinition.resourcesPaths)
                                .withNamedArg('--sentry-address', daprDefinition.sentryAddress)
                                .withNamedArg('--unix-domain-socket', daprDefinition.unixDomainSocket)
                                .withArgs(daprDefinition.args)
                                .build();

                        await callback(command, { cwd: definition.cwd, env: Object.assign({}, process.env, definition.options?.env) });
                    });
            },
            /* isBackgroundTask: */ true,
            /* problemMatchers: */ ['$dapr']);
    }
}