import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { Key } from './daprStateNode';

export class DaprKeyNode implements TreeNode {
    constructor(
        public readonly key: Key) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.key.name);

        item.contextValue = 'key';

        return Promise.resolve(item); 
    }
}
