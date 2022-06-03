// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import { DaprApplicationProvider, DaprApplication } from "../../services/daprApplicationProvider";
import { UserInput, WizardStep } from '../../services/userInput';
import { DaprClient } from '../../services/daprClient';
import { getApplication, getPayload } from './invokeCommon';
import { IActionContext, ITelemetryContext } from '@microsoft/vscode-azext-utils';
import { getLocalizationPathForFile } from '../../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

const publishMessagePubSubNameStateKey = 'vscode-docker.state.publishMessage.pubSubName';
const publishMessageTopicStateKey = 'vscode-docker.state.publishMessage.topic';
const publishMessagePayloadStateKey = 'vscode-docker.state.publishMessage.payload';

export async function getPubSubName(context: ITelemetryContext, ui: UserInput, workspaceState: vscode.Memento): Promise<string> {
    const previousMethod = workspaceState.get<string>(publishMessagePubSubNameStateKey);

    context.properties.cancelStep = 'pubSubName';

    const topic = await ui.showInputBox(
        {
            prompt: localize('commands.publishMessage.pubSubNamePrompt', 'Enter the publish/subscribe component name used to publish'),
            value: previousMethod,
            validateInput: value => {
                return value === ''
                    ? localize('commands.publishMessage.invalidPubSubName', 'A component name must be a non-empty string.')
                    : undefined;
            }
        });

    await workspaceState.update(publishMessagePubSubNameStateKey, topic);

    return topic;
}

export async function getTopic(context: ITelemetryContext, ui: UserInput, workspaceState: vscode.Memento): Promise<string> {
    const previousMethod = workspaceState.get<string>(publishMessageTopicStateKey);

    context.properties.cancelStep = 'topic';

    const topic = await ui.showInputBox(
        {
            prompt: localize('commands.publishMessage.topicPrompt', 'Enter the topic to publish'),
            value: previousMethod,
            validateInput: value => {
                return value === ''
                    ? localize('commands.publishMessage.invalidTopic', 'A topic must be a non-empty string.')
                    : undefined;
            }
        });

    await workspaceState.update(publishMessageTopicStateKey, topic);

    return topic;
}

interface PublishWizardContext {
    application: DaprApplication;
    pubSubName: string;
    topic: string;
    payload?: unknown;
}

export async function publishMessageCore(context: IActionContext, daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento, application: DaprApplication | undefined): Promise<void> {
    context.errorHandling.suppressReportIssue = true;

    const applicationStep: WizardStep<PublishWizardContext> =
        async wizardContext => {
            return {
                ...wizardContext,
                application: await getApplication(context.telemetry, daprApplicationProvider, ui, application)
            }
        };

    const pubSubNameStep: WizardStep<PublishWizardContext> =
        async wizardContext => {
            return {
                ...wizardContext,
                pubSubName: await getPubSubName(context.telemetry, ui, workspaceState)
            }
        };

    const topicStep: WizardStep<PublishWizardContext> =
        async wizardContext => {
            return {
                ...wizardContext,
                topic: await getTopic(context.telemetry, ui, workspaceState)
            };
        };

    const payloadStep: WizardStep<PublishWizardContext> =
        async wizardContext => {
            return {
                ...wizardContext,
                payload: await getPayload(context.telemetry, ui, workspaceState, publishMessagePayloadStateKey)
            };
        };

    const result = await ui.showWizard<PublishWizardContext>(
        {
            initialContext: { application },
            title: localize('commands.publishMessage.wizardTitle', 'Publish Dapr Message')
        },
        !application ? applicationStep : undefined, pubSubNameStep, topicStep, payloadStep);

    await ui.withProgress(
        localize('commands.publishMessage.publishProgressTitle', 'Publishing Dapr message'),
        async (_, token) => {
            outputChannel.appendLine(localize('commands.publishMessage.publishMessage', 'Publishing Dapr message \'{0}\' to application \'{1}\' with payload \'{2}\'...', result.topic, result.application.appId, JSON.stringify(result.payload)));

            await daprClient.publishMessage(result.application, result.pubSubName, result.topic, result.payload, token);
    
            outputChannel.appendLine(localize('commands.publishMessage.publishSucceededMessage', 'Message published'));

            outputChannel.show();
        });
}

export async function publishAllMessage(context: IActionContext, daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento): Promise<void> {
    const applications = await daprApplicationProvider.getApplications();

    // Published messages go to all applications, regardless of the application through which they are published, so use the first one...
    return await publishMessageCore(context, daprApplicationProvider, daprClient, outputChannel, ui, workspaceState, applications[0]);
}

export function publishMessage(context: IActionContext, daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento, node: DaprApplicationNode | undefined): Promise<void> {
    return publishMessageCore(context, daprApplicationProvider, daprClient, outputChannel, ui, workspaceState, node?.application);
}

export const createPublishAllMessageCommand = (daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento) => (context: IActionContext): Promise<void> => publishAllMessage(context, daprApplicationProvider, daprClient, outputChannel, ui, workspaceState);
export const createPublishMessageCommand = (daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento) => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => publishMessage(context, daprApplicationProvider, daprClient, outputChannel, ui, workspaceState, node);
