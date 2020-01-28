import * as vscode from 'vscode';
import DaprApplicationNode from "../views/applications/daprApplicationNode";
import { DaprApplicationProvider, DaprApplication } from "../services/daprApplicationProvider";
import { UserInput } from '../services/userInput';
import { DaprClient } from '../services/daprClient';

export async function invokePost(daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, node: DaprApplicationNode | undefined): Promise<void> {
    let application: DaprApplication;
    
    if (!node) {
        const applications = await daprApplicationProvider.getApplications();

        const selectedApplication = await ui.showQuickPick(applications.map(application => ({ application, label: application.appId })), { placeHolder: 'Select a Dapr application' });

        application = selectedApplication.application;
    } else {
        application = node.application;
    }

    const method = await ui.showInputBox({ prompt: 'Enter the application method to invoke' });
    const payloadString = await ui.showInputBox({ prompt: 'Enter a JSON payload for the method (or leave empty, if no payload is needed)'});
    const payload = JSON.parse(payloadString);

    await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, cancellable: true, title: 'Invoking Dapr application' },
        async (_, token) => {
            try {
                outputChannel.appendLine(`Invoking Dapr application '${application.appId}' method '${method}' with payload '${payload}'...`)

                const data = await daprClient.invokePost(application, method, payload, token);
        
                outputChannel.appendLine(`Method succeeded: ${data}`);
            } catch (err) {
                outputChannel.appendLine(`Method failed: ${err}`);
            }

            outputChannel.show();
        });
}

const createInvokePostCommand = (daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput) => (node: DaprApplicationNode | undefined): Promise<void> => invokePost(daprApplicationProvider, daprClient, outputChannel, ui, node);

export default createInvokePostCommand;
