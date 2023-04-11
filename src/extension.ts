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
import createInvokeGetCommand from './commands/applications/invokeGet';
import createInvokePostCommand from './commands/applications/invokePost';
import { createPublishAllMessageCommand, createPublishMessageCommand } from './commands/applications/publishMessage';
import AxiosHttpClient from './services/httpClient';
import { AggregateUserInput } from './services/userInput';
import HttpDaprClient, { getDaprClient } from './services/daprClient';
import createScaffoldDaprTasksCommand from './commands/scaffoldDaprTasks';
import AzureTelemetryProvider from './services/telemetryProvider';
import HelpTreeDataProvider from './views/help/helpTreeDataProvider';
import createReadDocumentationCommand from './commands/help/readDocumentation';
import createReportIssueCommand from './commands/help/reportIssue';
import createReviewIssuesCommand from './commands/help/reviewIssues';
import createGetStartedCommand from './commands/help/getStarted';
import createOpenDaprDashboardCommand from './commands/openDaprDashboard';
import LocalDaprInstallationManager from './services/daprInstallationManager';
import HandlebarsTemplateScaffolder from './scaffolding/templateScaffolder';
import LocalScaffolder from './scaffolding/scaffolder';
import NodeEnvironmentProvider from './services/environmentProvider';
import createScaffoldDaprComponentsCommand from './commands/scaffoldDaprComponents';
import VsCodeSettingsProvider from './services/settingsProvider';
import DaprBasedDaprDashboardProvider from './services/daprDashboardProvider';
import createStopCommand from './commands/applications/stopApp';
import LocalDaprCliClient from './services/daprCliClient';
import createInstallDaprCommand from './commands/help/installDapr';
import DetailsTreeDataProvider from './views/details/detailsTreeDataProvider';
import DaprListBasedDaprApplicationProvider from './services/daprApplicationProvider';
import { Observable, firstValueFrom } from 'rxjs';
import TreeNode from './views/treeNode';
import createDebugApplicationCommand from './commands/applications/debugApplication';
import createDebugRunCommand from './commands/applications/debugRun';
import { AsyncDisposable } from './util/asyncDisposable';
import createStartRunCommand from './commands/applications/startRun';
import createStopRunCommand from './commands/applications/stopRun';
import { DaprDebugConfigurationProvider } from './debug/daprDebugConfigurationProvider';
import createViewAppLogsCommand from './commands/applications/viewAppLogs';
import createViewDaprLogsCommand from './commands/applications/viewDaprLogs';
import createBrowseToApplicationCommand from './commands/applications/browseToApplication';
import DaprApplicationNode from './views/applications/daprApplicationNode';
import DaprComponentsNode from './views/applications/daprComponentsNode';
import { RedisDaprStateStoreProvider } from './services/daprStateStoreProvider';
import DaprStateStoreDocumentContentProvider from './documents/daprStateStoreDocumentContentProvider';
import { daprStateValueProviderFactory } from './services/daprStateValueProvider';
import { createDaprStateKeyProvider } from './services/daprStateKeyProvider';

interface ExtensionPackage {
	engines: { [key: string]: string };
}

const asyncDisposables: AsyncDisposable[] = [];

function registerAsyncDisposable<T extends AsyncDisposable>(disposable: T): T {
	asyncDisposables.push(disposable);

	return disposable;
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
			const daprApplicationProvider = new DaprListBasedDaprApplicationProvider(() => settingsProvider.daprPath);
			const daprClient = new HttpDaprClient(new AxiosHttpClient());
			const ui = new AggregateUserInput(actionContext.ui);

			const scaffolder = new LocalScaffolder();
			const templatesPath = path.join(context.extensionPath, 'assets', 'templates');
			const templateScaffolder = new HandlebarsTemplateScaffolder(templatesPath);

			const daprCliClient = new LocalDaprCliClient(() => settingsProvider.daprPath)
			const daprDashboardProvider = registerAsyncDisposable(new DaprBasedDaprDashboardProvider(daprCliClient));

			const extensionPackage = <ExtensionPackage>context.extension.packageJSON;
			const daprInstallationManager = new LocalDaprInstallationManager(
				extensionPackage.engines['dapr-cli'],
				extensionPackage.engines['dapr-runtime'],
				daprCliClient,
				ui);
			const daprCommandTaskProvider = new DaprCommandTaskProvider(daprInstallationManager, () => settingsProvider.daprPath, telemetryProvider);

			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.browse', createBrowseToApplicationCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.debug', createDebugApplicationCommand());
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.invoke-get', createInvokeGetCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.invoke-post', createInvokePostCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerCommandWithTelemetry('vscode-dapr.applications.publish-all-message', createPublishAllMessageCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.publish-message', createPublishMessageCommand(daprApplicationProvider, daprClient, ext.outputChannel, ui, context.workspaceState));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.stop-app', createStopCommand(daprCliClient, ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.view-app-logs', createViewAppLogsCommand());
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.applications.view-dapr-logs', createViewDaprLogsCommand());
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.readDocumentation', createReadDocumentationCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.getStarted', createGetStartedCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.installDapr', createInstallDaprCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.reportIssue', createReportIssueCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.help.reviewIssues', createReviewIssuesCommand(ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.runs.debug', createDebugRunCommand());
			telemetryProvider.registerCommandWithTelemetry('vscode-dapr.runs.start', createStartRunCommand(daprCommandTaskProvider));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.runs.stop', createStopRunCommand(daprCliClient));
			telemetryProvider.registerCommandWithTelemetry('vscode-dapr.tasks.scaffoldDaprComponents', createScaffoldDaprComponentsCommand(scaffolder, templateScaffolder));
			telemetryProvider.registerCommandWithTelemetry('vscode-dapr.tasks.scaffoldDaprTasks', createScaffoldDaprTasksCommand(scaffolder, templateScaffolder, ui));
			telemetryProvider.registerContextCommandWithTelemetry('vscode-dapr.tasks.openDaprDashboard', createOpenDaprDashboardCommand(daprDashboardProvider));

			registerDisposable(vscode.tasks.registerTaskProvider('dapr', daprCommandTaskProvider));
			registerDisposable(vscode.tasks.registerTaskProvider('daprd', new DaprdCommandTaskProvider(daprInstallationManager, () => settingsProvider.daprdPath, new NodeEnvironmentProvider(), telemetryProvider)));
			registerDisposable(vscode.tasks.registerTaskProvider('daprd-down', new DaprdDownTaskProvider(daprApplicationProvider, telemetryProvider)));
			
			registerDisposable(vscode.debug.registerDebugConfigurationProvider('dapr', new DaprDebugConfigurationProvider(daprApplicationProvider, ui)));

			const daprStateKeyProvider = createDaprStateKeyProvider(
				() => firstValueFrom(daprApplicationProvider.applications),
				getDaprClient);

			const applicationsTreeView = registerDisposable(
				vscode.window.createTreeView(
					'vscode-dapr.views.applications',
					{
						treeDataProvider: registerDisposable(
							new DaprApplicationTreeDataProvider(
								application => new DaprApplicationNode(
										application,
										application => new DaprComponentsNode(application, daprClient, daprStateKeyProvider)),
								daprApplicationProvider,
								daprClient,
								daprInstallationManager,
								ui))
					}));

			const selectionObservable = new Observable<readonly TreeNode[]>(
				subscriber => {
					const listener = applicationsTreeView.onDidChangeSelection(
						changeEvent => {
							subscriber.next(changeEvent.selection);
						});

					return () => {
						listener.dispose();
					};
				});

			registerDisposable(
				vscode.window.registerTreeDataProvider(
					'vscode-dapr.views.details',
					registerDisposable(new DetailsTreeDataProvider(selectionObservable))));

			registerDisposable(
				vscode.window.registerTreeDataProvider(
					'vscode-dapr.views.help',
					new HelpTreeDataProvider()));
		
			registerDisposable(
				vscode.workspace.registerTextDocumentContentProvider(
					'dapr',
					registerDisposable(new DaprStateStoreDocumentContentProvider(
						daprStateValueProviderFactory(
							daprApplicationProvider,
							getDaprClient)
						))));

			return Promise.resolve();
	});
}

export async function deactivate(): Promise<void> {
	for (const disposable of asyncDisposables) {
		await disposable.dispose();
	}
}
