// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as vscode from 'vscode';
import portfinder = require('portfinder');
import { spawn } from 'child_process';
import createPlatformProcessProvider from '../services/processProvider';


function getPortFromCommand(command: string): string {
    if (command.includes('--port')){
        command = command.split('--port')[1].toString().trim().split(" ")[0]
    }
    if (command.includes('-p') ){
        command = command.split('-p')[1].toString().trim().split(" ")[0]
    }
    return command;
}
class ProcessBasedDaprDashboardProvider {
    private processPlatform = createPlatformProcessProvider();
    port:string | undefined;

    async checkForDaprDashboard(): Promise<void> {
        const dashboardProcesses = await this.processPlatform.listProcesses('dashboard');
        if (dashboardProcesses.length > 0) {
            this.port = getPortFromCommand(dashboardProcesses[0].cmd)
        }
    }
}
export async function openDaprDashboard(): Promise<void> {
    const daprDashboardProvider = new ProcessBasedDaprDashboardProvider();

    await daprDashboardProvider.checkForDaprDashboard();

    if (daprDashboardProvider.port == undefined){
        portfinder.getPortPromise()
        .then((port) => {
            spawn('dapr', ['dashboard', '-p', `${port}`]);
            daprDashboardProvider.port = port.toString();
        }) 
        .catch((err) => {
            console.log(err);
        });    } 
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    await vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${daprDashboardProvider.port}`));
}

const createOpenDaprDashboardCommand = () => (): Promise<void> => openDaprDashboard();
export default createOpenDaprDashboardCommand;
