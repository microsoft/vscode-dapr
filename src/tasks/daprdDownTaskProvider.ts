import * as psList from 'ps-list';
import * as vscode from 'vscode';
import CustomExecutionTaskProvider from "./customExecutionTaskProvider";

interface DaprdTaskDefinition extends vscode.TaskDefinition {
    appId?: string;
}

export default class DaprdDownTaskProvider extends CustomExecutionTaskProvider {
    constructor() {
        super(
            async (definition: DaprdTaskDefinition, writer, token) => {
                if (definition.appId === undefined) {
                    throw new Error('The \'appId\' property must be set.');
                }

                const processes = await psList();
                const daprdProcesses = processes.filter(p => p.name === 'daprd');

                const argumentPattern = `--dapr-id ${definition.appId}`;

                const appProcesses = daprdProcesses.filter(p => p.cmd && p.cmd.indexOf(argumentPattern) >= 0);

                appProcesses.forEach(p => process.kill(p.pid, 'SIGKILL'));

                writer.writeLine('Shutting down daprd...');
            },
            /* isBackgroundTask: */ false,
            /* problemMatchers: */ []);
    }
}