// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import DaprApplicationNode from "../views/applications/daprApplicationNode";
import { DaprApplicationProvider } from "../services/daprApplicationProvider";
import { UserInput } from '../services/userInput';
import { DaprClient } from '../services/daprClient';
import { getApplication, getPayload } from './invokeCommon';
import { localize } from '../util/localize';
import { IActionContext, ITelemetryContext } from 'vscode-azureextensionui';

const publishMessageTopicStateKey = 'vscode-docker.state.publishMessage.topic';
const publishMessagePayloadStateKey = 'vscode-docker.state.publishMessage.payload';

export async function getTopic(context: ITelemetryContext, ui: UserInput, workspaceState: vscode.Memento): Promise<string> {
    const previousMethod = workspaceState.get<string>(publishMessageTopicStateKey);

    context.properties.cancelStep = 'topic';

    const topic = await ui.showInputBox({ prompt: localize('commands.publishMessage.topicPrompt', 'Enter the topic to publish'), value: previousMethod });

    await workspaceState.update(publishMessageTopicStateKey, topic);

    return topic;
}

export async function publishMessage(context: IActionContext, daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento, node: DaprApplicationNode | undefined): Promise<void> {
    context.errorHandling.suppressReportIssue = true;

    const application = await getApplication(context.telemetry, daprApplicationProvider, ui, node?.application);
    const topic = await getTopic(context.telemetry, ui, workspaceState);
    const payload = await getPayload(context.telemetry, ui, workspaceState, publishMessagePayloadStateKey);

    await ui.withProgress(
        localize('commands.publishMessage.publishProgressTitle', 'Publishing Dapr message'),
        async (_, token) => {
            outputChannel.appendLine(localize('commands.publishMessage.publishMessage', 'Publishing Dapr message \'{0}\' to application \'{1}\' with payload \'{2}\'...', topic, application.appId, JSON.stringify(payload)));

            await daprClient.publishMessage(application, topic, payload, token);
    
            outputChannel.appendLine(localize('commands.publishMessage.publishSucceededMessage', 'Message published'));

            outputChannel.show();
        });
}

const createPublishMessageCommand = (daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento) => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => publishMessage(context, daprApplicationProvider, daprClient, outputChannel, ui, workspaceState, node);

export default createPublishMessageCommand;
