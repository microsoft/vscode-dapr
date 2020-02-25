// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { DaprApplication, DaprApplicationProvider } from "../../services/daprApplicationProvider";
import { UserInput } from '../../services/userInput';
import { DaprClient } from '../../services/daprClient';
import { localize } from '../../util/localize';
import { IActionContext, ITelemetryContext } from 'vscode-azureextensionui';

const invokeGetMethodStateKey = 'vscode-docker.state.invokeGet.method';
const invokePostMethodStateKey = 'vscode-docker.state.invokePost.method';
const invokePostPayloadStateKey = 'vscode-docker.state.invokePost.payload';

export async function getApplication(context: ITelemetryContext, daprApplicationProvider: DaprApplicationProvider, ui: UserInput, selectedApplication?: DaprApplication): Promise<DaprApplication> {
    if (!selectedApplication) {
        const applications = await daprApplicationProvider.getApplications();

        context.properties.cancelStep = 'application';

        const pickedApplication = await ui.showQuickPick(applications.map(application => ({ application, label: application.appId })), { placeHolder: localize('commands.invokeCommon.applicationPlaceholder', 'Select a Dapr application') });

        selectedApplication = pickedApplication.application;
    }

    return selectedApplication;
}

export async function getMethod(context: ITelemetryContext, ui: UserInput, workspaceState: vscode.Memento, methodStateKey: string): Promise<string> {
    const previousMethod = workspaceState.get<string>(methodStateKey);

    context.properties.cancelStep = 'method';

    const method = await ui.showInputBox({ prompt: localize('commands.invokeCommon.methodPrompt', 'Enter the application method to invoke'), value: previousMethod });

    await workspaceState.update(methodStateKey, method);

    return method;
}

export async function getPayload(context: ITelemetryContext, ui: UserInput, workspaceState: vscode.Memento, payLoadStateKey: string): Promise<unknown> {
    const previousPayloadString = workspaceState.get<string>(payLoadStateKey);

    context.properties.cancelStep = 'payload';

    const payloadString = await ui.showInputBox({ prompt: localize('commands.invokeCommon.payloadPrompt', 'Enter a JSON payload for the method (or leave empty, if no payload is needed)'), value: previousPayloadString });

    const payload = JSON.parse(payloadString);

    await workspaceState.update(payLoadStateKey, payloadString);

    return payload;
}

export async function invoke(context: IActionContext, daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento, selectedApplication: DaprApplication | undefined, isPost?: boolean): Promise<void> {
    context.errorHandling.suppressReportIssue = true;

    const application = await getApplication(context.telemetry, daprApplicationProvider, ui, selectedApplication);
    const method = await getMethod(context.telemetry, ui, workspaceState, isPost ? invokePostMethodStateKey : invokeGetMethodStateKey);
    const payload = isPost ? await getPayload(context.telemetry, ui, workspaceState, invokePostPayloadStateKey) : undefined;

    await ui.withProgress(
        localize('commands.invokeCommon.invokeMessage', 'Invoking Dapr application'),
        async (_, token) => {
            if (isPost) {
                outputChannel.appendLine(localize('commands.invokeCommon.invokePostMessage', 'Invoking Dapr application \'{0}\' method \'{1}\' with payload \'{2}\'...', application.appId, method, JSON.stringify(payload)))
            } else {
                outputChannel.appendLine(localize('commands.invokeCommon.invokeGetMessage', 'Invoking Dapr application \'{0}\' method \'{1}\'...', application.appId, method))
            }

            const data = isPost
                ? await daprClient.invokePost(application, method, payload, token)
                : await daprClient.invokeGet(application, method, token);
    
            outputChannel.appendLine(localize('commands.invokeCommon.invokeSucceededMessage', 'Method succeeded: {0}', String(data)));

            outputChannel.show();
        });
}