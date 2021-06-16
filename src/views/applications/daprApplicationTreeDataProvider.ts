// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { DaprApplicationProvider } from '../../services/daprApplicationProvider';
import TreeNode from '../treeNode';
import DaprApplicationNode from './daprApplicationNode';
import { DaprInstallationManager } from '../../services/daprInstallationManager';
import { UserInput } from '../../services/userInput';

export default class DaprApplicationTreeDataProvider extends vscode.Disposable implements vscode.TreeDataProvider<TreeNode> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeNode | null | undefined>();
    private readonly applicationProviderListener: vscode.Disposable;

    constructor(
        private readonly applicationProvider: DaprApplicationProvider,
        private readonly installationManager: DaprInstallationManager,
        private readonly ui: UserInput) {
        super(() => {
            this.applicationProviderListener.dispose();
            this.onDidChangeTreeDataEmitter.dispose();
        });

        this.applicationProviderListener = this.applicationProvider.onDidChange(
            () => {
                this.onDidChangeTreeDataEmitter.fire(undefined);
            });
    }

    get onDidChangeTreeData(): vscode.Event<TreeNode | null | undefined> | undefined {
        return this.onDidChangeTreeDataEmitter.event;
    }
    
    getTreeItem(element: TreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();
    }

    async getChildren(): Promise<TreeNode[]> {
        const applications = await this.applicationProvider.getApplications();

        if (applications.length > 0) {
            return applications.map(application => new DaprApplicationNode(application));
        } else {
            const isInitialized = await this.installationManager.isInitialized();

            if (isInitialized) {
                await this.ui.executeCommand('setContext', 'vscode-dapr.views.applications.state', 'notRunning');
            } else {
                const isInstalled = await this.installationManager.isInstalled();
    
                if (isInstalled) {
                    await this.ui.executeCommand('setContext', 'vscode-dapr.views.applications.state', 'notInitialized');
                } else {
                    await this.ui.executeCommand('setContext', 'vscode-dapr.views.applications.state', 'notInstalled');
                }
            }
    
            // NOTE: Returning zero children indicates to VS Code that is should display a "welcome view".
            //       The one chosen for display depends on the context set above.

            return [];
        }
    }
}