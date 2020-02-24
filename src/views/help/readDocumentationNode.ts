// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { localize } from '../../util/localize';

export default class ReadDocumentationNode implements TreeNode {
    getTreeItem(): Promise<vscode.TreeItem> {
        const treeItem = new vscode.TreeItem(localize('views.readDocumentationNode.label', 'Read Documentation'));

        treeItem.command = {
            arguments: [ this ],
            command: 'vscode-dapr.help.readDocumentation',
            title: '' // NOTE: Title is required but unused here.
        };

        treeItem.iconPath = new vscode.ThemeIcon('book');

        return Promise.resolve(treeItem);
    }
}