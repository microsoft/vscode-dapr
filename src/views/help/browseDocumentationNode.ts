// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { localize } from '../../util/localize';

export default class BrowseDocumentationNode implements TreeNode {
    getTreeItem(): Promise<vscode.TreeItem> {
        return Promise.resolve(new vscode.TreeItem(localize('views.browseDocumentationNode.label', 'Browse documentation')));
    }
}