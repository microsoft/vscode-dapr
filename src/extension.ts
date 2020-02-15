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
import DaprApplicationTreeDataProvider from './views/applications/daprApplicationTreeDataProvider';
import ProcessBasedDaprApplicationProvider from './services/daprApplicationProvider';
import createInvokeGetCommand from './commands/invokeGet';
import createInvokePostCommand from './commands/invokePost';
import AxiosHttpClient from './services/httpClient';
import { AggregateUserInput } from './services/userInput';
import HttpDaprClient from './services/daprClient';
import { localize } from './util/localize';

export function activate(context: vscode.ExtensionContext): void {
	const message = localize('sayHello.text', 'Hello');
		vscode.window.showInformationMessage(message);

	function registerDisposable<T extends vscode.Disposable>(disposable: T): T {
		context.subscriptions.push(disposable);
	
		return disposable;
	}

	ext.context = context;
	ext.ignoreBundle = true;
	ext.outputChannel = registerDisposable(createAzExtOutputChannel('Dapr', 'dapr'));
	ext.reporter = createTelemetryReporter(context);
	ext.ui = new AzureUserInput(context.globalState);

    registerUIExtensionVariables(ext);

	initializeTemplateScaffolder(context.extensionPath);

	const daprApplicationProvider = registerDisposable(new ProcessBasedDaprApplicationProvider());
	const daprClient = new HttpDaprClient(new AxiosHttpClient());
	const ui = new AggregateUserInput(ext.ui);

	registerDisposable(vscode.commands.registerCommand('vscode-dapr.applications.invoke-get', createInvokeGetCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState)));
	registerDisposable(vscode.commands.registerCommand('vscode-dapr.applications.invoke-post', createInvokePostCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState)));
    registerDisposable(vscode.commands.registerCommand('vscode-dapr.tasks.scaffoldDaprTasks', scaffoldDaprTasks));

    registerDisposable(vscode.tasks.registerTaskProvider('dapr', new DaprCommandTaskProvider()));
    registerDisposable(vscode.tasks.registerTaskProvider('daprd', new DaprdCommandTaskProvider()));
	registerDisposable(vscode.tasks.registerTaskProvider('daprd-down', new DaprdDownTaskProvider()));
	
	registerDisposable(
		vscode.window.registerTreeDataProvider(
			'vscode-dapr.views.applications',
			registerDisposable(new DaprApplicationTreeDataProvider(daprApplicationProvider))));
}
