// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { localize } from '../../util/localize';

export default class ReportIssueNode implements TreeNode {
    getTreeItem(): Promise<vscode.TreeItem> {
        const treeItem = new vscode.TreeItem(localize('views.reportIssue.label', 'Report Issue'));

        treeItem.command = {
            arguments: [ this ],
            command: 'vscode-dapr.help.reportIssue',
            title: '' // NOTE: Title is required but unused here.
        };

        treeItem.iconPath = new vscode.ThemeIcon('comment');

        return Promise.resolve(treeItem);
    }
}