// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from "../treeNode";

export default class DaprMetadataNode implements TreeNode {
    constructor(public readonly metadata: string) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.metadata);

        item.contextValue = 'metadata';

        item.iconPath = new vscode.ThemeIcon('database');

        return Promise.resolve(item);
    }

    
}