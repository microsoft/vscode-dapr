import CommandLineBuilder from '../util/commandLineBuilder';
import CommandTaskProvider from './commandTaskProvider';
import { TaskDefinition } from './taskDefinition';

type DaprdLogLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal' | 'panic';

export interface DaprdTaskDefinition extends TaskDefinition {
    allowedOrigins?: string;
    alsoLogToStdErr?: boolean;
    appId?: string;
    appPort?: number;
    componentsPath?: string;
    config?: string;
    controlPlaneAddress?: string;
    enableProfiling?: boolean;
    grcpPort?: number;
    httpPort?: number;
    logLevel?: DaprdLogLevel;
    logBacktraceAt?: number;
    logDir?: string;
    maxConcurrency?: number;
    mode?: 'standalone' | 'kubernetes';
    placementAddress?: string;
    profilePort?: number;
    protocol?: 'grpc' | 'http';
    stdErrThreshold?: DaprdLogLevel;
    vLogLevel?: DaprdLogLevel;
    vLogFilters?: string; // TODO: Allow more structured filters.
}

export default class DaprdCommandTaskProvider extends CommandTaskProvider {
    constructor() {
        super(
            (definition, callback, token) => {
                const daprDefinition =<DaprdTaskDefinition>definition;

                const command =
                    CommandLineBuilder
                        .create('daprd')
                        .withNamedArg('--allowed-origins', daprDefinition.allowedOrigins)
                        .withFlagArg('--alsoLogToStdErr', daprDefinition.alsoLogToStdErr)
                        .withNamedArg('--app-port', daprDefinition.appPort)
                        .withNamedArg('--components-path', daprDefinition.componentsPath)
                        .withNamedArg('--config', daprDefinition.config)
                        .withNamedArg('--control-plane-address', daprDefinition.controlPlaneAddress)
                        .withNamedArg('--dapr-grpc-port', daprDefinition.grcpPort)
                        .withNamedArg('--dapr-http-port', daprDefinition.httpPort)
                        .withNamedArg('--dapr-id', daprDefinition.appId)
                        .withFlagArg('--enable-profiling', daprDefinition.enableProfiling)
                        .withNamedArg('--log-level', daprDefinition.logLevel)
                        .withNamedArg('--log_backtrace_at', daprDefinition.logBacktraceAt)
                        .withNamedArg('--log_dir', daprDefinition.logDir)
                        .withNamedArg('--max-concurrency', daprDefinition.maxConcurrency)
                        .withNamedArg('--mode', daprDefinition.mode)
                        .withNamedArg('--placement-address', daprDefinition.placementAddress || "localhost:50005" /* NOTE: The placement address is actually required for daprd. */)
                        .withNamedArg('--profile-port', daprDefinition.profilePort)
                        .withNamedArg('--protocol', daprDefinition.protocol)
                        .withNamedArg('--stderrthreshold', daprDefinition.stdErrThreshold)
                        .withNamedArg('-v', daprDefinition.vLogLevel)
                        .withNamedArg('-vmodule', daprDefinition.vLogFilters)
                        .build();

                return callback(command, { cwd: definition.cwd });
            },
            /* isBackgroundTask: */ true,
            /* problemMatchers: */ ['$dapr']);
    }
}