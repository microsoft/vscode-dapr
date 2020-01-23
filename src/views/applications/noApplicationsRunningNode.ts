import * as vscode from 'vscode';
import TreeNode from './treeNode';

export default class NoApplicationsRunningNode implements TreeNode {
    getTreeItem(): Promise<vscode.TreeItem> {
        return Promise.resolve(new vscode.TreeItem('No Dapr applications are running.'));
    }
}