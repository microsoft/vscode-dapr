import * as vscode from "vscode";
import { DaprApplication } from "../../services/daprApplicationProvider";
import { DaprClient } from "../../services/daprClient";
import TreeNode from "../treeNode";
import DaprApplicationNode from "./daprApplicationNode";

export class DaprRunNode implements TreeNode {
    constructor(
        private readonly name: string,
        public readonly applications: DaprApplication[],
        private readonly daprClient: DaprClient) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.name, vscode.TreeItemCollapsibleState.Expanded);

        item.contextValue = ['run', this.applications.some(application => application.appPid !== undefined) ? 'attachable' : ''].join(' ');

        return Promise.resolve(item);
    }

    getChildren(): TreeNode[] {
        return this.applications.map(application => new DaprApplicationNode(application, this.daprClient));
    }
}