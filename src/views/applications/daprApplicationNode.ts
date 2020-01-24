import * as vscode from 'vscode';
import TreeNode from "./treeNode";
import { DaprApplication } from '../../services/daprApplicationProvider';

export default class DaprApplicationNode implements TreeNode {
    constructor(public readonly application: DaprApplication) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.application.appId);

        item.contextValue = 'application';

        return Promise.resolve(item);
    }
}