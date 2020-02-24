// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import BrowseDocumentationNode from './browseDocumentationNode';
import ReportIssueNode from './reportIssueNode';
import ReviewIssuesNode from './reviewIssuesNode';
import GetStartedNode from './getStartedNode';

export default class HelpTreeDataProvider implements vscode.TreeDataProvider<TreeNode> {
    onDidChangeTreeData?: vscode.Event<TreeNode>;

    getTreeItem(element: TreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();
    }

    getChildren(): vscode.ProviderResult<TreeNode[]> {
        return [
            new GetStartedNode(),
            new BrowseDocumentationNode(),
            new ReviewIssuesNode(),
            new ReportIssueNode()
        ];
    }
}
