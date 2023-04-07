import * as dapr from '@dapr/dapr';
import * as vscode from 'vscode';
import { DaprApplicationProvider } from './daprApplicationProvider';
import { firstValueFrom } from 'rxjs';
import { DaprClientApplication } from './daprClient';

export type DaprStateValueProvider = (applicationId: string, componentsName: string, key: string, token: vscode.CancellationToken) => vscode.ProviderResult<string>;

export function daprStateValueProviderFactory(
    daprApplicationProvider: DaprApplicationProvider,
    daprClientProvider: (application: DaprClientApplication) => dapr.DaprClient): DaprStateValueProvider {
    return async (applicationId: string, componentsName: string, key: string) => {
        const applications = await firstValueFrom(daprApplicationProvider.applications);
        const application = applications.find(application => application.appId === applicationId);

        if (!application) {
            throw new Error(`Application '${applicationId}' not found.`);
        }

        const daprClient = daprClientProvider(application);

        const value = await daprClient.state.get(componentsName, key);

        if (value === undefined) {
            return '';
        }

        if (typeof value === 'string') {
            return value;
        }

        return JSON.stringify(value, null, 2);
    };
}
