// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { DaprApplication, DaprApplicationProvider } from "../../services/daprApplicationProvider";
import { UserInput, WizardStep } from '../../services/userInput';
import { DaprClient } from '../../services/daprClient';
import { IActionContext, ITelemetryContext } from 'vscode-azureextensionui';
import { getLocalizationPathForFile } from '../../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

const invokeGetMethodStateKey = 'vscode-docker.state.invokeGet.method';
const invokePostMethodStateKey = 'vscode-docker.state.invokePost.method';
const invokePostPayloadStateKey = 'vscode-docker.state.invokePost.payload';

export async function getApplication(context: ITelemetryContext, daprApplicationProvider: DaprApplicationProvider, ui: UserInput, selectedApplication?: DaprApplication): Promise<DaprApplication> {
    if (!selectedApplication) {
        const applications = await daprApplicationProvider.getApplications();

        if (applications.length === 0) {
            throw new Error(localize('commands.invokeCommon.noApplicationsMessage', 'No Dapr applications are running.'));
        }

        context.properties.cancelStep = 'application';

        const pickedApplication = await ui.showQuickPick(applications.map(application => ({ application, label: application.appId })), { placeHolder: localize('commands.invokeCommon.applicationPlaceholder', 'Select a Dapr application') });

        selectedApplication = pickedApplication.application;
    }

    return selectedApplication;
}

export async function getMethod(context: ITelemetryContext, ui: UserInput, workspaceState: vscode.Memento, methodStateKey: string): Promise<string> {
    const previousMethod = workspaceState.get<string>(methodStateKey);

    context.properties.cancelStep = 'method';

    const method = await ui.showInputBox(
        {
            prompt: localize('commands.invokeCommon.methodPrompt', 'Enter the application method to invoke'),
            validateInput: value => {
                return value === ''
                    ? localize('commands.invokeCommon.invalidMethod', 'An application method must be a non-empty string.')
                    : undefined;
            },
            value: previousMethod
        });

    await workspaceState.update(methodStateKey, method);

    return method;
}

export async function getPayload(context: ITelemetryContext, ui: UserInput, workspaceState: vscode.Memento, payLoadStateKey: string): Promise<unknown> {
    const previousPayloadString = workspaceState.get<string>(payLoadStateKey);

    context.properties.cancelStep = 'payload';

    const payloadString = await ui.showInputBox(
        { 
            prompt: localize('commands.invokeCommon.payloadPrompt', 'Enter a JSON payload for the method (or leave empty, if no payload is needed)'),
            validateInput: value => {
                try {
                    if (value) {
                        JSON.parse(value);
                    }

                    return undefined;
                } catch (err) {
                    return (<Error>err).message;
                }
            },
            value: previousPayloadString
        });

    const payload = payloadString ? <unknown>JSON.parse(payloadString) : undefined;

    await workspaceState.update(payLoadStateKey, payloadString);

    return payload;
}

interface InvokeWizardContext {
    application: DaprApplication;
    method: string;
    payload?: unknown;
}

export async function invoke(context: IActionContext, daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento, application: DaprApplication | undefined, isPost?: boolean): Promise<void> {
    context.errorHandling.suppressReportIssue = true;

    const applicationStep: WizardStep<InvokeWizardContext> =
        async wizardContext => {
            return {
                ...wizardContext,
                application: await getApplication(context.telemetry, daprApplicationProvider, ui, application)
            }
        };

    const methodStep: WizardStep<InvokeWizardContext> =
        async wizardContext => {
            return {
                ...wizardContext,
                method: await getMethod(context.telemetry, ui, workspaceState, isPost ? invokePostMethodStateKey : invokeGetMethodStateKey)
            };
        };

    const payloadStep: WizardStep<InvokeWizardContext> =
        async wizardContext => {
            return {
                ...wizardContext,
                payload: isPost ? await getPayload(context.telemetry, ui, workspaceState, invokePostPayloadStateKey) : undefined
            };
        };

    const result = await ui.showWizard<InvokeWizardContext>(
        {
            initialContext: { application },
            title: localize('commands.invokeCommon.wizardTitle', 'Invoke Dapr Application')
        },
        !application ? applicationStep : undefined, methodStep, isPost ? payloadStep : undefined);

    await ui.withProgress(
        localize('commands.invokeCommon.invokeMessage', 'Invoking Dapr application'),
        async (_, token) => {
            if (isPost) {
                outputChannel.appendLine(localize('commands.invokeCommon.invokePostMessage', 'Invoking Dapr application \'{0}\' method \'{1}\' with payload \'{2}\'...', result.application.appId, result.method, JSON.stringify(result.payload)))
            } else {
                outputChannel.appendLine(localize('commands.invokeCommon.invokeGetMessage', 'Invoking Dapr application \'{0}\' method \'{1}\'...', result.application.appId, result.method))
            }

            const data = isPost
                ? await daprClient.invokePost(result.application, result.method, result.payload, token)
                : await daprClient.invokeGet(result.application, result.method, token);
    
            outputChannel.appendLine(localize('commands.invokeCommon.invokeSucceededMessage', 'Method succeeded: {0}', JSON.stringify(data)));

            outputChannel.show();
        });
}

export async function stop(context: IActionContext, daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, ui: UserInput, application: DaprApplication | undefined): Promise<void> {
    try {
        daprClient.stopApp(await getApplication(context.telemetry, daprApplicationProvider, ui, application))
    } catch(error) {
        await ui.showWarningMessage(localize('commands.invokeCommon.stopAppError', 'Failed to stop the selected application'),
        { modal: true });
    }
}