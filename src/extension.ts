// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import DaprCommandTaskProvider from './tasks/daprCommandTaskProvider';
import DaprdCommandTaskProvider from './tasks/daprdCommandTaskProvider';
import DaprdDownTaskProvider from './tasks/daprdDownTaskProvider';
import scaffoldDaprTasks from './commands/scaffoldDaprTasks';
import { AzureUserInput, createAzExtOutputChannel, createTelemetryReporter, registerUIExtensionVariables } from 'vscode-azureextensionui';
import ext from './ext';
import { initializeTemplateScaffolder } from './scaffolding/templateScaffolder';

export function activate(context: vscode.ExtensionContext): void {
	ext.context = context;
	ext.ignoreBundle = true;
	ext.outputChannel = createAzExtOutputChannel('Dapr', 'dapr');
	context.subscriptions.push(ext.outputChannel);
	ext.reporter = createTelemetryReporter(context);
	ext.ui = new AzureUserInput(context.globalState);

    registerUIExtensionVariables(ext);

	initializeTemplateScaffolder(context.extensionPath);

    context.subscriptions.push(vscode.commands.registerCommand('vscode-dapr.scaffoldDaprTasks', scaffoldDaprTasks));

    context.subscriptions.push(vscode.tasks.registerTaskProvider('dapr', new DaprCommandTaskProvider()));
    context.subscriptions.push(vscode.tasks.registerTaskProvider('daprd', new DaprdCommandTaskProvider()));
    context.subscriptions.push(vscode.tasks.registerTaskProvider('daprd-down', new DaprdDownTaskProvider()));
}
