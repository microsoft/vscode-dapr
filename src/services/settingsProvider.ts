import * as vscode from 'vscode';

export interface SettingsProvider {
    readonly daprdPath: string;
}

export default class VsCodeSettingsProvider implements SettingsProvider {
    get daprdPath(): string {
        const configuration = vscode.workspace.getConfiguration('vscode-dapr.configuration');

        return configuration.get('daprdPath') || 'daprd';
    }
}