import * as vscode from 'vscode';
import CommandLineBuilder from '../util/commandLineBuilder';
import { Process } from '../util/process';
import CustomExecutionTaskProvider from './customExecutionTaskProvider';

type DaprTaskDefinition = {
    appId?: string;
    appPort?: number;
    command?: string[];
    config?: string;
    cwd?: string;
    enableProfiling?: boolean;
    grpcPort?: number;
    httpPort?: number;
    image?: string;
    logLevel?: 'debug' | 'info' | 'warning' | 'error' | 'fatal' | 'panic';
    maxConcurrency?: number;
    placementHost?: string;
    profilePort?: number;
};

export default class DaprTaskProvider extends CustomExecutionTaskProvider {
    constructor() {
        super(
            async (definition, writer, token) => {
                const daprDefinition =<DaprTaskDefinition>definition;

                const command = CommandLineBuilder
                    .create('dapr', 'run')
                    .withNamedArg('--app-id', daprDefinition.appId)
                    .withNamedArg('--app-port', daprDefinition.appPort)
                    .withNamedArg('--config', daprDefinition.config)
                    .withFlagArg('--enable-profiling', daprDefinition.enableProfiling)
                    .withNamedArg('--grpc-port', daprDefinition.grpcPort)
                    .withNamedArg('--image', daprDefinition.image)
                    .withNamedArg('--log-level', daprDefinition.logLevel)
                    .withNamedArg('--max-concurrency', daprDefinition.maxConcurrency)
                    .withNamedArg('--placement-host', daprDefinition.placementHost)
                    .withNamedArg('--port', daprDefinition.httpPort)
                    .withNamedArg('--profile-port', daprDefinition.profilePort)
                    .withArgs(daprDefinition.command)
                    .build();

                const process = new Process();

                try {
                    process.onStdErr(
                        data => {
                            writer.write(data);
                        });

                    process.onStdOut(
                        data => {
                            writer.write(data);
                        });

                    let cwd = daprDefinition.cwd;

                    if (cwd === undefined) {
                        if (vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 0) {
                            throw new Error('If no current working directory is set, you must open a workspace before running a Dapr task.');
                        }

                        cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
                    }

                    await process.spawn(
                        command,
                        {
                            cwd
                        },
                        token);
                } finally {
                    process.dispose();
                }
            });
    }
}