// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import DaprCommandTaskProvider from './tasks/daprCommandTaskProvider';
import DaprdCommandTaskProvider from './tasks/daprdCommandTaskProvider';
import DaprdDownTaskProvider from './tasks/daprdDownTaskProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.tasks.registerTaskProvider("dapr", new DaprCommandTaskProvider()));
	context.subscriptions.push(vscode.tasks.registerTaskProvider("daprd", new DaprdCommandTaskProvider()));
	context.subscriptions.push(vscode.tasks.registerTaskProvider("daprd-down", new DaprdDownTaskProvider()));
}

// this method is called when your extension is deactivated
export function deactivate() {}
