// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from "../treeNode";

export default class DaprMetadataNode implements TreeNode {
    constructor(private readonly metadata: string, private readonly themeIconId: string) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.metadata);

        item.contextValue = 'metadata';

        item.iconPath = new vscode.ThemeIcon(this.themeIconId);

        return Promise.resolve(item);
    }

    
}