import * as vscode from 'vscode';
import TreeNode from '../treeNode';

export class DaprKeyNode implements TreeNode {
    constructor(private readonly key: string) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.key);

        item.contextValue = 'metadata';

        return Promise.resolve(item); 
    }
}
