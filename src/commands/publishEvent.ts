import * as vscode from 'vscode';
import DaprApplicationNode from "../views/applications/daprApplicationNode";
import { DaprApplicationProvider } from "../services/daprApplicationProvider";
import { UserInput } from '../services/userInput';
import { DaprClient } from '../services/daprClient';
import { getApplication, getPayload, isError } from './invokeCommon';

const publishEventTopicStateKey = 'vscode-docker.state.publishEvent.topic';

export async function getTopic(ui: UserInput, workspaceState: vscode.Memento): Promise<string> {
    const previousMethod = workspaceState.get<string>(publishEventTopicStateKey);

    const topic = await ui.showInputBox({ prompt: 'Enter the topic to publish', value: previousMethod });

    await workspaceState.update(publishEventTopicStateKey, topic);

    return topic;
}

export async function publishEvent(daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento, node: DaprApplicationNode | undefined): Promise<void> {
    const application = await getApplication(daprApplicationProvider, ui, node?.application);
    const topic = await getTopic(ui, workspaceState);
    const payload = await getPayload(ui, workspaceState);

    await ui.withProgress(
        'Publishing Dapr event',
        async (_, token) => {
            try {
                outputChannel.appendLine(`Publishing Dapr event '${topic}' to application '${application.appId}' with payload '${payload}'...`);

                await daprClient.publishEvent(application, topic, payload, token);
        
                outputChannel.appendLine('Event published');
            } catch (err) {
                outputChannel.appendLine(`Event publication failed: ${isError(err) ? err.message : err.toString()}`);
            }

            outputChannel.show();
        });
}

const createPublishEventCommand = (daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento) => (node: DaprApplicationNode | undefined): Promise<void> => publishEvent(daprApplicationProvider, daprClient, outputChannel, ui, workspaceState, node);

export default createPublishEventCommand;
