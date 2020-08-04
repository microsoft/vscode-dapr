// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import TreeNode from '../treeNode';

const localize = nls.loadMessageBundle();

export default class ReviewIssuesNode implements TreeNode {
    getTreeItem(): Promise<vscode.TreeItem> {
        const treeItem = new vscode.TreeItem(localize('views.reviewIssues.label', 'Review Issues'));

        treeItem.command = {
            arguments: [ this ],
            command: 'vscode-dapr.help.reviewIssues',
            title: '' // NOTE: Title is required but unused here.
        };

        treeItem.iconPath = new vscode.ThemeIcon('issues');

        return Promise.resolve(treeItem);
    }
}