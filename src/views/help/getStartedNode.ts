// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { localize } from '../../util/localize';

export default class GetStartedNode implements TreeNode {
    getTreeItem(): Promise<vscode.TreeItem> {
        const treeItem = new vscode.TreeItem(localize('views.getStarted.label', 'Get Started'));

        treeItem.command = {
            arguments: [ this ],
            command: 'vscode-dapr.help.getStarted',
            title: '' // NOTE: Title is required but unused here.
        };

        treeItem.iconPath = new vscode.ThemeIcon('star-empty');

        return Promise.resolve(treeItem);
    }
}