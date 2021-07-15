// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { DaprApplication, DaprApplicationProvider } from '../../services/daprApplicationProvider';
import DaprDetailsNode from './daprDetailsNode';
import { DaprComponentMetadata } from '../../services/daprClient';

export default class DetailsTreeDataProvider extends vscode.Disposable implements vscode.TreeDataProvider<TreeNode> {    
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeNode | null | undefined>();
    private readonly applicationProviderListener: vscode.Disposable;
    private details: string[] = [];
    private detailLabels: string[] = [];

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
        const list : DaprDetailsNode[] = []
        for(let i = 0; i < this.detailLabels.length; i++) {
            list.push(new DaprDetailsNode(this.detailLabels[i], this.details[i]));
        }
        return list;
    }

    setAppDetails(application: DaprApplication | undefined) : void {
        this.detailLabels = ["App ID", "App Port", "Dapr HTTP Port", "Dapr GRPC Port", "Dapr Process ID"];
        if(application !== undefined) {
            this.details = [application?.appId.toString(), 
                application?.appPort !== undefined ? application?.appPort.toString() : "None", 
                application?.httpPort.toString(), application?.grpcPort.toString(), application?.pid.toString()]
        }
    }

    setComponentDetails(component: DaprComponentMetadata | undefined) : void {
        this.detailLabels = ["Name", "Type", "Version"]
        if(component !== undefined) {
            this.details = [component.name, component.type, component.version]
        }
    }
    
}