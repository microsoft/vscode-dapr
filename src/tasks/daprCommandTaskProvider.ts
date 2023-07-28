// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import CommandLineBuilder from '../util/commandLineBuilder';
import CommandTaskProvider from './commandTaskProvider';
import { TaskDefinition } from './taskDefinition';
import { TelemetryProvider } from '../services/telemetryProvider';
import { IActionContext } from '@microsoft/vscode-azext-utils';
import { DaprInstallationManager } from '../services/daprInstallationManager';
import * as fs from 'fs/promises';
import path from 'path';
import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { getLocalizationPathForFile } from '../util/localization';
import { isNullOrUndefined } from 'util';

export interface DaprTaskDefinition extends TaskDefinition {
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
    internalGrpcPort?: number;
    listenAddresses?: string;
    logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'panic';
    metricsPort?: number;
    placementHostAddress?: string;
    profilePort?: number;
    resourcesPath?: string;
    resourcesPaths?: string[];
    runFile?: string;
    type: 'dapr';
    unixDomainSocket?: string;
}

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export default class DaprCommandTaskProvider extends CommandTaskProvider {
    constructor(daprInstallationManager: DaprInstallationManager, daprPathProvider: () => string, telemetryProvider: TelemetryProvider) {
        super(
            (definition, callback) => {
                return telemetryProvider.callWithTelemetry(
                    'vscode-dapr.tasks.dapr',
                    async (context: IActionContext) => {

                        await daprInstallationManager.ensureInitialized(context.errorHandling);

                        const daprDefinition = definition as DaprTaskDefinition;

                        // infer dapr.yaml when omitted from configuration
                        for (const def in daprDefinition) {
                            // skip daprDefinition.type as it will be set by default
                            // if any property being set means do not need to infer dapr.yaml
                            if (Object.prototype.hasOwnProperty.call(daprDefinition, def) && def !== "type" && def !== undefined) {
                                const command = createCommandLineBuilder(daprPathProvider, daprDefinition).build();
                                return callback(command, { cwd: definition.cwd });
                            }
                        }

                        // when all properties are undefined the command "dapr run --run-file ./dapr.yaml" will be excuted.
                        const folder = vscode.workspace.workspaceFolders?.[0];

                        if (!folder) {
                            context.errorHandling.suppressReportIssue = true;
                            throw new Error(localize('tasks.daprCommandTaskProvider.noFolderOrWorkspace', 'Open a folder or workspace.'));
                        }

                        const runFilePath = path.join(folder.uri.fsPath, 'dapr.yaml');

                        await checkFileExists(runFilePath).then((fileExists) => {
                            if (fileExists) {
                                const command = createCommandLineBuilder(daprPathProvider).withNamedArg('--run-file', runFilePath).build();
                                return callback(command, { cwd: definition.cwd });
                            } else {
                                throw new Error(localize('tasks.daprCommandTaskProvider.noRunFile', 'there is no dapr.yaml in this folder or workspace.'));
                            }
                        });
                    });
            },
            /* isBackgroundTask: */ true,
            /* problemMatchers: */['$dapr']);
    }
}

async function checkFileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        return false;
    }
}


function createCommandLineBuilder(daprPathProvider: () => string, daprDefinition?: DaprTaskDefinition) {
    if (daprDefinition) {
        const commandLineBuilder =
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

        return commandLineBuilder;
    }
    else {
        const commandLineBuilder = CommandLineBuilder.create(daprPathProvider(), 'run')
        return commandLineBuilder;
    }

}