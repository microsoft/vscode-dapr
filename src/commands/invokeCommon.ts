import * as vscode from 'vscode';
import { DaprApplication, DaprApplicationProvider } from "../services/daprApplicationProvider";
import { UserInput } from '../services/userInput';
import { DaprClient } from '../services/daprClient';

export async function getApplication(daprApplicationProvider: DaprApplicationProvider, ui: UserInput, selectedApplication?: DaprApplication): Promise<DaprApplication> {
    if (!selectedApplication) {
        const applications = await daprApplicationProvider.getApplications();

        const pickedApplication = await ui.showQuickPick(applications.map(application => ({ application, label: application.appId })), { placeHolder: 'Select a Dapr application' });

        selectedApplication = pickedApplication.application;
    }

    return selectedApplication;
}

export function getMethod(ui: UserInput): Promise<string> {
    return ui.showInputBox({ prompt: 'Enter the application method to invoke' });
}

export async function invoke(daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, selectedApplication: DaprApplication | undefined, isPost?: boolean): Promise<void> {
    const application = await getApplication(daprApplicationProvider, ui, selectedApplication);
    const method = await getMethod(ui);

    let payload: unknown;

    if (isPost) {
        const payloadString = await ui.showInputBox({ prompt: 'Enter a JSON payload for the method (or leave empty, if no payload is needed)'});

        payload = JSON.parse(payloadString);
    }

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