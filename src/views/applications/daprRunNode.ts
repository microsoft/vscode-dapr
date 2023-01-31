import * as vscode from "vscode";
import { DaprApplication } from "../../services/daprApplicationProvider";
import { DaprClient } from "../../services/daprClient";
import TreeNode from "../treeNode";
import DaprApplicationNode from "./daprApplicationNode";

export class DaprRunNode implements TreeNode {
    constructor(
        private readonly name: string,
        private readonly applications: DaprApplication[],
        private readonly daprClient: DaprClient) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        var treeItem = new vscode.TreeItem(this.name, vscode.TreeItemCollapsibleState.Expanded);

        return Promise.resolve(treeItem);
    }

    getChildren(): TreeNode[] {
        return this.applications.map(application => new DaprApplicationNode(application, this.daprClient));
    }
}