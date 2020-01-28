import * as vscode from 'vscode';
import { DaprApplication, DaprApplicationProvider } from "../services/daprApplicationProvider";
import { UserInput } from '../services/userInput';
import { DaprClient } from '../services/daprClient';

const invokeMethodStateKey = 'vscode-docker.state.invoke.method';
const invokePayloadStateKey = 'vscode-docker.state.invoke.payload';

export async function getApplication(daprApplicationProvider: DaprApplicationProvider, ui: UserInput, selectedApplication?: DaprApplication): Promise<DaprApplication> {
    if (!selectedApplication) {
        const applications = await daprApplicationProvider.getApplications();

        const pickedApplication = await ui.showQuickPick(applications.map(application => ({ application, label: application.appId })), { placeHolder: 'Select a Dapr application' });

        selectedApplication = pickedApplication.application;
    }

    return selectedApplication;
}

export async function getMethod(ui: UserInput, workspaceState: vscode.Memento): Promise<string> {
    const previousMethod = workspaceState.get<string>(invokeMethodStateKey);

    const method = await ui.showInputBox({ prompt: 'Enter the application method to invoke', value: previousMethod });

    await workspaceState.update(invokeMethodStateKey, method);

    return method;
}

export async function getPayload(ui: UserInput, workspaceState: vscode.Memento): Promise<string> {
    const previousPayloadString = workspaceState.get<string>(invokePayloadStateKey);

    const payloadString = await ui.showInputBox({ prompt: 'Enter a JSON payload for the method (or leave empty, if no payload is needed)', value: previousPayloadString });

    const payload = JSON.parse(payloadString);

    await workspaceState.update(invokePayloadStateKey, payloadString);

    return payload;
}

export async function invoke(daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, workspaceState: vscode.Memento, selectedApplication: DaprApplication | undefined, isPost?: boolean): Promise<void> {
    const application = await getApplication(daprApplicationProvider, ui, selectedApplication);
    const method = await getMethod(ui, workspaceState);
    const payload = isPost ? await getPayload(ui, workspaceState) : undefined;

    await ui.withProgress(
        'Invoking Dapr application',
        async (_, token) => {
            try {
                if (isPost) {
                    outputChannel.appendLine(`Invoking Dapr application '${application.appId}' method '${method}' with payload '${payload}'...`)
                } else {
                    outputChannel.appendLine(`Invoking Dapr application '${application.appId}' method '${method}'...`)
                }

                const data = isPost
                    ? await daprClient.invokePost(application, method, payload, token)
                    : await daprClient.invokeGet(application, method, token);
        
                outputChannel.appendLine(`Method succeeded: ${data}`);
            } catch (err) {
                outputChannel.appendLine(`Method failed: ${err}`);
            }

            outputChannel.show();
        });
}