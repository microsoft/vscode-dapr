// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export default interface TreeNode {
    getTreeItem(): Promise<vscode.TreeItem>;
    getChildren?: () => TreeNode[] | Promise<TreeNode[]>;
}
