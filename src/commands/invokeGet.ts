import axios from 'axios';
import DaprApplicationNode from "../views/applications/daprApplicationNode";
import { DaprApplicationProvider, DaprApplication } from "../services/daprApplicationProvider";
import { IAzureUserInput } from "vscode-azureextensionui";

export async function invokeGet(daprApplicationProvider: DaprApplicationProvider, ui: IAzureUserInput, node: DaprApplicationNode | undefined): Promise<void> {
    let application: DaprApplication;
    
    if (!node) {
        const applications = await daprApplicationProvider.getApplications();

        const selectedApplication = await ui.showQuickPick(applications.map(application => ({ application, label: application.appId })), { placeHolder: 'Select a Dapr application' });

        application = selectedApplication.application;
    } else {
        application = node.application;
    }

    const method = await ui.showInputBox({ prompt: 'Enter the application method to invoke' });

    const url = `http://localhost:${application.httpPort}/v1.0/invoke/${application.appId}/method/${method}`;

    try {
        const response = await axios.get(url);

        console.log(response.data);
    } catch (err) {
        console.error(err.toString());
    }
}

const createInvokeGetCommand = (daprApplicationProvider: DaprApplicationProvider, ui: IAzureUserInput) => (node: DaprApplicationNode | undefined): Promise<void> => invokeGet(daprApplicationProvider, ui, node);

export default createInvokeGetCommand;