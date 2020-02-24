// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { localize } from '../../util/localize';

export default class ReviewIssuesNode implements TreeNode {
    getTreeItem(): Promise<vscode.TreeItem> {
        const treeItem = new vscode.TreeItem(localize('views.reviewIssues.label', 'Review issues'));

        treeItem.command = {
            arguments: [ this ],
            command: 'vscode-dapr.help.reviewIssues',
            title: '' // NOTE: Title is required but unused here.
        };

        return Promise.resolve(treeItem);
    }
}