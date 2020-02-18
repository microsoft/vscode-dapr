// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import DaprApplicationNode from "../views/applications/daprApplicationNode";
import { DaprApplicationProvider } from "../services/daprApplicationProvider";
import { UserInput } from '../services/userInput';
import { DaprClient } from '../services/daprClient';
import { getApplication, getPayload, isError } from './invokeCommon';
import { localize } from '../util/localize';

const publishMessageTopicStateKey = 'vscode-docker.state.publishMessage.topic';
const publishMessagePayloadStateKey = 'vscode-docker.state.publishMessage.payload';

export async function getTopic(ui: UserInput, workspaceState: vscode.Memento): Promise<string> {
    const previousMethod = workspaceState.get<string>(publishMessageTopicStateKey);

    const topic = await ui.showInputBox({ prompt: localize('commands.publishMessage.topicPrompt', 'Enter the topic to publish'), value: previousMethod });

    await workspaceState.update(publishMessageTopicStateKey, topic);

    return topic;
}

export async function publishMessage(daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento, node: DaprApplicationNode | undefined): Promise<void> {
    const application = await getApplication(daprApplicationProvider, ui, node?.application);
    const topic = await getTopic(ui, workspaceState);
    const payload = await getPayload(ui, workspaceState, publishMessagePayloadStateKey);

    await ui.withProgress(
        localize('commands.publishMessage.publishProgressTitle', 'Publishing Dapr message'),
        async (_, token) => {
            try {
                outputChannel.appendLine(localize('commands.publishMessage.publishMessage', 'Publishing Dapr message \'{0}\' to application \'{1}\' with payload \'{2}\'...', topic, application.appId, JSON.stringify(payload)));

                await daprClient.publishMessage(application, topic, payload, token);
        
                outputChannel.appendLine(localize('commands.publishMessage.publishSucceededMessage', 'Message published'));
            } catch (err) {
                outputChannel.appendLine(localize('commands.publishMessage.publishFailedMessage', 'Message publication failed: {0}', isError(err) ? err.message : err.toString()));
            }

            outputChannel.show();
        });
}

const createPublishMessageCommand = (daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento) => (node: DaprApplicationNode | undefined): Promise<void> => publishMessage(daprApplicationProvider, daprClient, outputChannel, ui, workspaceState, node);

export default createPublishMessageCommand;
