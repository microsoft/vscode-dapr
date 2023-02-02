// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from "../treeNode";
import { DaprApplication } from '../../services/daprApplicationProvider';
import DaprComponentsNode from "./daprComponentsNode";
import { DaprClient } from '../../services/daprClient';

export default class DaprApplicationNode implements TreeNode {
    constructor(public readonly application: DaprApplication, public readonly daprClient: DaprClient) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.application.appId, vscode.TreeItemCollapsibleState.Collapsed);

        item.contextValue = ['application', this.application.appPid !== undefined ? 'attachable' : ''].join(' ');
        item.iconPath = new vscode.ThemeIcon('globe');

        return Promise.resolve(item);
    }

    getChildren(): TreeNode[] {
        return [new DaprComponentsNode(this.application, this.daprClient)];
    }
}