// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { DaprApplication, DaprApplicationProvider } from '../../services/daprApplicationProvider';
import DaprAppDetailsNode from './daprAppDetailsNode';

export default class AppDetailsTreeDataProvider extends vscode.Disposable implements vscode.TreeDataProvider<TreeNode> {    
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeNode | null | undefined>();
    private readonly applicationProviderListener: vscode.Disposable;
    private appDetails: string[] = [];

    constructor(
        private readonly applicationProvider: DaprApplicationProvider) {
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

    getChildren(): TreeNode[] {
        const labels = ["App ID", "App Port", "Dapr HTTP Port", "Dapr GRPC Port", "Process ID"];
        const list : DaprAppDetailsNode[] = []
        for(let i = 0; i < labels.length; i++) {
            list.push(new DaprAppDetailsNode(labels[i], this.appDetails[i]));
        }
        return list;
    }

    getAppDetails(application: DaprApplication | undefined) : void {
        if(application !== undefined) {
            this.appDetails = [application?.appId.toString(), application?.appPort.toString(), application?.httpPort.toString(), application?.grpcPort.toString(), application?.pid.toString()]
        }
    }
    
}