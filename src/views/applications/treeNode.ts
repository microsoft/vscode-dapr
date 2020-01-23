import * as vscode from 'vscode';

export default interface TreeNode {
    getTreeItem(): Promise<vscode.TreeItem>;
}
