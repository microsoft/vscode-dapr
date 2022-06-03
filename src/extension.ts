// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as path from 'path';
import * as vscode from 'vscode';
import DaprCommandTaskProvider from './tasks/daprCommandTaskProvider';
import DaprdCommandTaskProvider from './tasks/daprdCommandTaskProvider';
import DaprdDownTaskProvider from './tasks/daprdDownTaskProvider';
import { createAzExtOutputChannel, registerUIExtensionVariables, IActionContext } from '@microsoft/vscode-azext-utils';
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
import createOpenDaprDashboardCommand from './commands/openDaprDashboard';
import LocalDaprInstallationManager from './services/daprInstallationManager';
import HandlebarsTemplateScaffolder from './scaffolding/templateScaffolder';
import LocalScaffolder from './scaffolding/scaffolder';
import NodeEnvironmentProvider from './services/environmentProvider';
import createScaffoldDaprComponentsCommand from './commands/scaffoldDaprComponents';
import VsCodeSettingsProvider from './services/settingsProvider';
import ProcessBasedDaprDashboardProvider from './services/daprDashboardProvider';
import createStopCommand from './commands/applications/stopApp';
import LocalDaprCliClient from './services/daprCliClient';
import createInstallDaprCommand from './commands/help/installDapr';
import DetailsTreeDataProvider from './views/details/detailsTreeDataProvider';
import createSetAppDetailsCommand from './commands/applications/setAppDetails';
import createSetComponentDetailsCommand from './commands/applications/setComponentDetails';

interface ExtensionPackage {
	engines: { [key: string]: string };
}

export function activate(context: vscode.ExtensionContext): Promise<void> {
	function registerDisposable<T extends vscode.Disposable>(disposable: T): T {
		context.subscriptions.push(disposable);
		
		return disposable;
	}

	ext.context = context;
	ext.ignoreBundle = true;
	ext.outputChannel = registerDisposable(createAzExtOutputChannel('Dapr', 'dapr'));

	registerUIExtensionVariables(ext);

	const telemetryProvider = new AzureTelemetryProvider();

	return telemetryProvider.callWithTelemetry(
		'vscode-dapr.extension.activate',
		(actionContext: IActionContext) => {
			actionContext.telemetry.properties.isActivationEvent = 'true';
			
			const settingsProvider = new VsCodeSettingsProvider();
			const daprApplicationProvider = registerDisposable(new ProcessBasedDaprApplicationProvider(createPlatformProcessProvider(), settingsProvider));
			const daprClient = new HttpDaprClient(new AxiosHttpClient());
			const ui = new AggregateUserInput(actionContext.ui);

			const scaffolder = new LocalScaffolder();
			const templatesPath = path.join(context.extensionPath, 'assets', 'templates');
			const templateScaffolder = new HandlebarsTemplateScaffolder(templatesPath);
			const detailsTreeDataProvider = new DetailsTreeDataProvider(daprApplicationProvider)

			const daprCliClient = new LocalDaprCliClient(() => settingsProvider.daprPath)
			const daprDashboardProvider = new ProcessBasedDaprDashboardProvider(() => settingsProvider.daprPath);


			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.invoke-get', createInvokeGetCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.invoke-post', createInvokePostCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerCommandWithTelemetry('vscode-dapr.applications.publish-all-message', createPublishAllMessageCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.publish-message', createPublishMessageCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.views.appDetails', createSetAppDetailsCommand(detailsTreeDataProvider));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.views.componentDetails', createSetComponentDetailsCommand(detailsTreeDataProvider));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.stop-app', createStopCommand(daprCliClient, ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.readDocumentation', createReadDocumentationCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.getStarted', createGetStartedCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.installDapr', createInstallDaprCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.reportIssue', createReportIssueCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.reviewIssues', createReviewIssuesCommand(ui));
			telemetryProvider.registerCommandWithTelemetry('vscode-dapr.tasks.scaffoldDaprComponents', createScaffoldDaprComponentsCommand(scaffolder, templateScaffolder));
			telemetryProvider.registerCommandWithTelemetry('vscode-dapr.tasks.scaffoldDaprTasks', createScaffoldDaprTasksCommand(scaffolder, templateScaffolder, ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.tasks.openDaprDashboard', createOpenDaprDashboardCommand(daprDashboardProvider));

			
			const extensionPackage = <ExtensionPackage>context.extension.packageJSON;
			const daprInstallationManager = new LocalDaprInstallationManager(
				extensionPackage.engines['dapr-cli'],
				extensionPackage.engines['dapr-runtime'],
				daprCliClient,
				ui);

			registerDisposable(vscode.tasks.registerTaskProvider('dapr', new DaprCommandTaskProvider(daprInstallationManager, () => settingsProvider.daprPath, telemetryProvider)));
			registerDisposable(vscode.tasks.registerTaskProvider('daprd', new DaprdCommandTaskProvider(daprInstallationManager, () => settingsProvider.daprdPath, new NodeEnvironmentProvider(), telemetryProvider)));
			registerDisposable(vscode.tasks.registerTaskProvider('daprd-down', new DaprdDownTaskProvider(daprApplicationProvider, telemetryProvider)));
			
			registerDisposable(
				vscode.window.registerTreeDataProvider(
					'vscode-dapr.views.applications',
					registerDisposable(new DaprApplicationTreeDataProvider(daprApplicationProvider, daprClient, daprInstallationManager, ui))));

			registerDisposable(
				vscode.window.registerTreeDataProvider(
					'vscode-dapr.views.details',
					registerDisposable(detailsTreeDataProvider)));

			registerDisposable(
				vscode.window.registerTreeDataProvider(
					'vscode-dapr.views.help',
					new HelpTreeDataProvider()));
		
			return Promise.resolve();
	});
}

export function deactivate(): Promise<void> {
	return Promise.resolve();
}