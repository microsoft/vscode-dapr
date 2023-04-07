import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { Key } from '../applications/daprStateNode';

export class DaprKeyNode implements TreeNode {
    constructor(
        public readonly key: Key) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.key.name);

        item.command = {
            arguments: [this.key.value],
            command: 'vscode.open',
            title: ''
        };

        item.contextValue = 'key';
        item.iconPath = new vscode.ThemeIcon('key');

        return Promise.resolve(item); 
    }
}
