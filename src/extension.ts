// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import DaprCommandTaskProvider from './tasks/daprCommandTaskProvider';
import DaprdCommandTaskProvider from './tasks/daprdCommandTaskProvider';
import DaprdDownTaskProvider from './tasks/daprdDownTaskProvider';
import { AzureUserInput, createAzExtOutputChannel, createTelemetryReporter, registerUIExtensionVariables, IActionContext } from 'vscode-azureextensionui';
import ext from './ext';
import { initializeTemplateScaffolder } from './scaffolding/templateScaffolder';
import DaprApplicationTreeDataProvider from './views/applications/daprApplicationTreeDataProvider';
import ProcessBasedDaprApplicationProvider from './services/daprApplicationProvider';
import createInvokeGetCommand from './commands/applications/invokeGet';
import createInvokePostCommand from './commands/applications/invokePost';
import createPublishMessageCommand from './commands/applications/publishMessage';
import AxiosHttpClient from './services/httpClient';
import { AggregateUserInput } from './services/userInput';
import HttpDaprClient from './services/daprClient';
import createScaffoldDaprTasksCommand from './commands/scaffoldDaprTasks';
import AzureTelemetryProvider from './services/telemetryProvider';
import HelpTreeDataProvider from './views/help/helpTreeDataProvider';
import createBrowseDocumentationCommand from './commands/help/browseDocumentation';
import createReportIssueCommand from './commands/help/reportIssue';
import createReviewIssuesCommand from './commands/help/reviewIssues';
import createGetStartedCommand from './commands/help/getStarted';

export function activate(context: vscode.ExtensionContext): Promise<void> {
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

	const telemetryProvider = new AzureTelemetryProvider();

	return telemetryProvider.callWithTelemetry(
		'vscode-dapr.extension.activate',
		(actionContext: IActionContext) => {
			actionContext.telemetry.properties.isActivationEvent = 'true';

			initializeTemplateScaffolder(context.extensionPath);
			
			const daprApplicationProvider = registerDisposable(new ProcessBasedDaprApplicationProvider());
			const daprClient = new HttpDaprClient(new AxiosHttpClient());
			const ui = new AggregateUserInput(ext.ui);
			
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.invoke-get', createInvokeGetCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.invoke-post', createInvokePostCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.publish-message', createPublishMessageCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.browseDocumentation', createBrowseDocumentationCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.getStarted', createGetStartedCommand());
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.reportIssue', createReportIssueCommand());
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.reviewIssues', createReviewIssuesCommand());
			telemetryProvider.registerCommandWithTelemetry('vscode-dapr.tasks.scaffoldDaprTasks', createScaffoldDaprTasksCommand(ui));
			
			registerDisposable(vscode.tasks.registerTaskProvider('dapr', new DaprCommandTaskProvider(telemetryProvider)));
			registerDisposable(vscode.tasks.registerTaskProvider('daprd', new DaprdCommandTaskProvider(telemetryProvider)));
			registerDisposable(vscode.tasks.registerTaskProvider('daprd-down', new DaprdDownTaskProvider(telemetryProvider)));
			
			registerDisposable(
				vscode.window.registerTreeDataProvider(
					'vscode-dapr.views.applications',
					registerDisposable(new DaprApplicationTreeDataProvider(daprApplicationProvider))));

			registerDisposable(
				vscode.window.registerTreeDataProvider(
					'vscode-dapr.views.help',
					new HelpTreeDataProvider()));
		
			return Promise.resolve();
	});
}