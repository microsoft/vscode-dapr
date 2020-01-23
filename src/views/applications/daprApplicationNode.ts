import * as vscode from 'vscode';
import TreeNode from "./treeNode";
import { DaprApplication } from '../../services/daprApplicationProvider';

export default class DaprApplicationNode implements TreeNode {
    constructor(private readonly application: DaprApplication) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        return Promise.resolve(new vscode.TreeItem(this.application.appId));
    }
}