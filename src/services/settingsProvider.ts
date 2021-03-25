import * as vscode from 'vscode';

export interface SettingsProvider {
    readonly daprPath: string;
    readonly daprdPath: string;
}

export default class VsCodeSettingsProvider implements SettingsProvider {
    get daprPath(): string {
        return this.getConfigurationValue('daprPath') || 'dapr';
    }

    get daprdPath(): string {
        return this.getConfigurationValue('daprdPath') || 'daprd';
    }

    private getConfigurationValue(name: string): string | undefined {
        const configuration = vscode.workspace.getConfiguration('dapr.paths');

        return configuration.get(name);
    }
}
