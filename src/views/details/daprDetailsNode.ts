// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from "../treeNode";

export default class DaprDetailsNode implements TreeNode {
    constructor(private readonly metadata: string, private readonly description: string) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.metadata);

        item.contextValue = 'metadata';

        item.description = this.description;

        return Promise.resolve(item);
    }

    
}