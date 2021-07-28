// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { DaprComponentMetadata } from '../../services/daprClient';
import TreeNode from "../treeNode";

export default class DaprComponentMetadataNode implements TreeNode {
    constructor(public readonly daprComponentMetadata: DaprComponentMetadata, private readonly themeIconId: string) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.daprComponentMetadata.name);

        item.contextValue = 'metadata';

        item.iconPath = new vscode.ThemeIcon(this.themeIconId);

        item.command = {
            arguments: [ this ],
            command: 'vscode-dapr.views.componentDetails',
            title: '' // NOTE: Title is required but unused here.
        };

        return Promise.resolve(item); 
    }

    
}