import * as vscode from 'vscode';
import { DaprApplication, DaprApplicationProvider } from '../../services/daprApplicationProvider';

export default class DaprApplicationTreeDataProvider implements vscode.TreeDataProvider<DaprApplication> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<DaprApplication | null | undefined>();

    constructor(private readonly applicationProvider: DaprApplicationProvider) {
        this.applicationProvider.onDidChange(
            () => {
                this.onDidChangeTreeDataEmitter.fire(undefined);
            });
    }

    get onDidChangeTreeData(): vscode.Event<DaprApplication | null | undefined> | undefined {
        return this.onDidChangeTreeDataEmitter.event;
    }
    
    getTreeItem(element: DaprApplication): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return new vscode.TreeItem(element.appId);
    }

    getChildren(): vscode.ProviderResult<DaprApplication[]> {
        return this.applicationProvider.getApplications();
    }
}