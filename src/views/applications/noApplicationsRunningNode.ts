// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { localize } from '../../util/localize';

export default class NoApplicationsRunningNode implements TreeNode {
    getTreeItem(): Promise<vscode.TreeItem> {
        const treeItem = new vscode.TreeItem(localize('views.noApplicationsRunningNode.label', 'No Dapr applications are running.'));

        treeItem.iconPath = new vscode.ThemeIcon('warning');

        return Promise.resolve(treeItem);
    }
}
