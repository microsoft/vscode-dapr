/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as vscode from 'vscode';
import portfinder = require('portfinder');



function ensureTerminalDoesNotExist(): boolean {
    const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
    for (const terminal of terminals) {
        if (terminal.name === 'Dapr Dashboard Terminal') {
            vscode.window.showInformationMessage('Dapr Dashboard Terminal Already Exists');
            return false;
        }
    }
	return true;
}

export async function openDaprDashboard(): Promise<void> {
    if (ensureTerminalDoesNotExist()){
        const terminal = vscode.window.createTerminal(`Dapr Dashboard Terminal`);
        await portfinder.getPortPromise()
        .then((port) => {
            const portUsed: number = port;
            terminal.sendText(`dapr dashboard -p ${portUsed}`);
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`http://localhost:${portUsed}`));
        })
        .catch((err) => {
            return Promise.reject(err);
        });
    }
}

const createOpenDaprDashboardCommand = () => (): Promise<void> => openDaprDashboard();
export default createOpenDaprDashboardCommand;