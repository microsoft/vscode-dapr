import * as vscode from 'vscode';
import DaprApplicationNode from "../views/applications/daprApplicationNode";
import { DaprApplicationProvider, DaprApplication } from "../services/daprApplicationProvider";
import { UserInput } from '../services/userInput';
import { DaprClient } from '../services/daprClient';

export async function invokeGet(daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput, node: DaprApplicationNode | undefined): Promise<void> {
    let application: DaprApplication;
    
    if (!node) {
        const applications = await daprApplicationProvider.getApplications();

        const selectedApplication = await ui.showQuickPick(applications.map(application => ({ application, label: application.appId })), { placeHolder: 'Select a Dapr application' });

        application = selectedApplication.application;
    } else {
        application = node.application;
    }

    const method = await ui.showInputBox({ prompt: 'Enter the application method to invoke' });

    await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, cancellable: true, title: 'Invoking Dapr application' },
        async (_, token) => {
            try {
                outputChannel.appendLine(`Invoking Dapr application '${application.appId}' method '${method}'...`)

                const data = await daprClient.invokeGet(application, method, token);
        
                outputChannel.appendLine(`Method succeeded: ${data}`);
            } catch (err) {
                outputChannel.appendLine(`Method failed: ${err}`);
            }

            outputChannel.show();
        });
}

const createInvokeGetCommand = (daprApplicationProvider: DaprApplicationProvider, daprClient: DaprClient, outputChannel: vscode.OutputChannel, ui: UserInput) => (node: DaprApplicationNode | undefined): Promise<void> => invokeGet(daprApplicationProvider, daprClient, outputChannel, ui, node);

export default createInvokeGetCommand;