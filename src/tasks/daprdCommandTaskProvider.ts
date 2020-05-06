// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import CommandLineBuilder from '../util/commandLineBuilder';
import CommandTaskProvider from './commandTaskProvider';
import { TaskDefinition } from './taskDefinition';
import { TelemetryProvider } from '../services/telemetryProvider';
import { EnvironmentProvider } from '../services/environmentProvider';

type DaprdLogLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal' | 'panic';

export interface DaprdTaskDefinition extends TaskDefinition {
    allowedOrigins?: string;
    alsoLogToStdErr?: boolean;
    appId?: string;
    appPort?: number;
    args?: string[];
    componentsPath?: string;
    config?: string;
    controlPlaneAddress?: string;
    enableProfiling?: boolean;
    enableMetrics?: boolean;
    enableMtls?: boolean;
    grpcPort?: number;
    httpPort?: number;
    logAsJson?: boolean;
    logLevel?: DaprdLogLevel;
    logBacktraceAt?: number;
    logDir?: string;
    logToStdErr?: boolean;
    maxConcurrency?: number;
    metricsPort?: number;
    mode?: 'standalone' | 'kubernetes';
    placementAddress?: string;
    profilePort?: number;
    protocol?: 'grpc' | 'http';
    sentryAddress?: string;
    stdErrThreshold?: DaprdLogLevel;
    type: 'daprd';
    vLogLevel?: DaprdLogLevel;
    vLogFilters?: string; // TODO: Allow more structured filters.
}

export default class DaprdCommandTaskProvider extends CommandTaskProvider {
    constructor(
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
                                .create('daprd')
                                .withNamedArg('--allowed-origins', daprDefinition.allowedOrigins)
                                .withNamedArg('--alsologtostderr', daprDefinition.alsoLogToStdErr, { assignValue: true })
                                .withNamedArg('--app-id', daprDefinition.appId)
                                .withNamedArg('--app-port', daprDefinition.appPort)
                                .withNamedArg('--components-path', daprDefinition.componentsPath)
                                .withNamedArg('--config', daprDefinition.config)
                                .withNamedArg('--control-plane-address', daprDefinition.controlPlaneAddress)
                                .withNamedArg('--dapr-grpc-port', daprDefinition.grpcPort)
                                .withNamedArg('--dapr-http-port', daprDefinition.httpPort)
                                .withNamedArg('--enable-metrics', daprDefinition.enableMetrics, { assignValue: true })
                                .withNamedArg('--enable-mtls', daprDefinition.enableMtls, { assignValue: true })
                                .withNamedArg('--enable-profiling', daprDefinition.enableProfiling, { assignValue: true })
                                .withNamedArg('--log-as-json', daprDefinition.logAsJson, { assignValue: true })
                                .withNamedArg('--log-level', daprDefinition.logLevel)
                                .withNamedArg('--log_backtrace_at', daprDefinition.logBacktraceAt)
                                .withNamedArg('--log_dir', daprDefinition.logDir)
                                .withNamedArg('--logtostderr', daprDefinition.logToStdErr, { assignValue: true })
                                .withNamedArg('--max-concurrency', daprDefinition.maxConcurrency)
                                .withNamedArg('--metrics-port', daprDefinition.metricsPort)
                                .withNamedArg('--mode', daprDefinition.mode)
                                .withNamedArg('--placement-address', daprDefinition.placementAddress ?? `${process.env.DAPR_PLACEMENT_HOST ?? 'localhost'}:${environmentProvider.isWindows ? 6050 : 50005}` /* NOTE: The placement address is actually required for daprd. */)
                                .withNamedArg('--profile-port', daprDefinition.profilePort)
                                .withNamedArg('--protocol', daprDefinition.protocol)
                                .withNamedArg('--sentry-address', daprDefinition.sentryAddress)
                                .withNamedArg('--stderrthreshold', daprDefinition.stdErrThreshold)
                                .withNamedArg('--v', daprDefinition.vLogLevel)
                                .withNamedArg('--vmodule', daprDefinition.vLogFilters)
                                .withArgs(daprDefinition.args)
                                .build();

                        return callback(command, { cwd: definition.cwd });
                    });
            },
            /* isBackgroundTask: */ true,
            /* problemMatchers: */ ['$dapr']);
    }
}