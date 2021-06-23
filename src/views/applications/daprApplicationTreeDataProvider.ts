// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { DaprApplicationProvider } from '../../services/daprApplicationProvider';
import TreeNode from '../treeNode';
import DaprApplicationNode from './daprApplicationNode';
import NoApplicationsRunningNode from './noApplicationsRunningNode';
import { DaprInstallationManager } from '../../services/daprInstallationManager';

export default class DaprApplicationTreeDataProvider extends vscode.Disposable implements vscode.TreeDataProvider<TreeNode> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeNode | null | undefined>();
    private readonly applicationProviderListener: vscode.Disposable;

    constructor(
        private readonly applicationProvider: DaprApplicationProvider,
        private readonly installationManager: DaprInstallationManager) {
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

    async getChildren(element?: TreeNode): Promise<TreeNode[]> {
        if (element) {
            return element.getChildren?.() ?? [];
        } else {
            const applications = await this.applicationProvider.getApplications();
            const appNodeList = applications.map(application => new DaprApplicationNode(application));
 

            if (appNodeList.length > 0) {
                return appNodeList;
            } else {
                return [ new NoApplicationsRunningNode(this.installationManager) ];
            }
        }

    }
}