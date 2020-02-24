// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { localize } from '../../util/localize';

export default class BrowseDocumentationNode implements TreeNode {
    getTreeItem(): Promise<vscode.TreeItem> {
        const treeItem = new vscode.TreeItem(localize('views.browseDocumentationNode.label', 'Browse documentation'));

        treeItem.command = {
            arguments: [ this ],
            command: 'vscode-dapr.help.browseDocumentation',
            title: '' // NOTE: Title is required but unused here.
        };

        return Promise.resolve(treeItem);
    }
}