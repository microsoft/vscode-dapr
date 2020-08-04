// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as path from 'path';
import * as vscode from 'vscode';
import DaprCommandTaskProvider from './tasks/daprCommandTaskProvider';
import DaprdCommandTaskProvider from './tasks/daprdCommandTaskProvider';
import DaprdDownTaskProvider from './tasks/daprdDownTaskProvider';
import { AzureUserInput, createAzExtOutputChannel, registerUIExtensionVariables, IActionContext } from 'vscode-azureextensionui';
import ext from './ext';
import DaprApplicationTreeDataProvider from './views/applications/daprApplicationTreeDataProvider';
import ProcessBasedDaprApplicationProvider from './services/daprApplicationProvider';
import createInvokeGetCommand from './commands/applications/invokeGet';
import createInvokePostCommand from './commands/applications/invokePost';
import { createPublishAllMessageCommand, createPublishMessageCommand } from './commands/applications/publishMessage';
import AxiosHttpClient from './services/httpClient';
import { AggregateUserInput } from './services/userInput';
import HttpDaprClient from './services/daprClient';
import createScaffoldDaprTasksCommand from './commands/scaffoldDaprTasks';
import AzureTelemetryProvider from './services/telemetryProvider';
import HelpTreeDataProvider from './views/help/helpTreeDataProvider';
import createReadDocumentationCommand from './commands/help/readDocumentation';
import createReportIssueCommand from './commands/help/reportIssue';
import createReviewIssuesCommand from './commands/help/reviewIssues';
import createGetStartedCommand from './commands/help/getStarted';
import createPlatformProcessProvider from './services/processProvider';
import LocalDaprInstallationManager from './services/daprInstallationManager';
import HandlebarsTemplateScaffolder from './scaffolding/templateScaffolder';
import LocalScaffolder from './scaffolding/scaffolder';
import NodeEnvironmentProvider from './services/environmentProvider';

export function activate(context: vscode.ExtensionContext): Promise<void> {
	function registerDisposable<T extends vscode.Disposable>(disposable: T): T {
		context.subscriptions.push(disposable);
		
		return disposable;
	}

	ext.context = context;
	ext.ignoreBundle = true;
	ext.outputChannel = registerDisposable(createAzExtOutputChannel('Dapr', 'dapr'));
	ext.ui = new AzureUserInput(context.globalState);

	registerUIExtensionVariables(ext);

	const telemetryProvider = new AzureTelemetryProvider();

	return telemetryProvider.callWithTelemetry(
		'vscode-dapr.extension.activate',
		(actionContext: IActionContext) => {
			actionContext.telemetry.properties.isActivationEvent = 'true';
			
			const daprApplicationProvider = registerDisposable(new ProcessBasedDaprApplicationProvider(createPlatformProcessProvider()));
			const daprClient = new HttpDaprClient(new AxiosHttpClient());
			const ui = new AggregateUserInput(ext.ui);

			const scaffolder = new LocalScaffolder();
			const templatesPath = path.join(context.extensionPath, 'assets', 'templates');
			const templateScaffolder = new HandlebarsTemplateScaffolder(templatesPath);

			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.invoke-get', createInvokeGetCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.invoke-post', createInvokePostCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerCommandWithTelemetry('vscode-dapr.applications.publish-all-message', createPublishAllMessageCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.publish-message', createPublishMessageCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.readDocumentation', createReadDocumentationCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.getStarted', createGetStartedCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.reportIssue', createReportIssueCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.reviewIssues', createReviewIssuesCommand(ui));
			telemetryProvider.registerCommandWithTelemetry('vscode-dapr.tasks.scaffoldDaprTasks', createScaffoldDaprTasksCommand(scaffolder, templateScaffolder, ui));
			
			registerDisposable(vscode.tasks.registerTaskProvider('dapr', new DaprCommandTaskProvider(telemetryProvider)));
			registerDisposable(vscode.tasks.registerTaskProvider('daprd', new DaprdCommandTaskProvider(new NodeEnvironmentProvider(), telemetryProvider)));
			registerDisposable(vscode.tasks.registerTaskProvider('daprd-down', new DaprdDownTaskProvider(daprApplicationProvider, telemetryProvider)));
			
			registerDisposable(
				vscode.window.registerTreeDataProvider(
					'vscode-dapr.views.applications',
					registerDisposable(new DaprApplicationTreeDataProvider(daprApplicationProvider, new LocalDaprInstallationManager()))));

			registerDisposable(
				vscode.window.registerTreeDataProvider(
					'vscode-dapr.views.help',
					new HelpTreeDataProvider()));
		
			return Promise.resolve();
	});
}