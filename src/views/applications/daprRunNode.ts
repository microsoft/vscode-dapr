// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { DaprApplication } from "../../services/daprApplicationProvider";
import { DaprClient } from "../../services/daprClient";
import TreeNode from "../treeNode";
import DaprApplicationNode from "./daprApplicationNode";

export class DaprRunNode implements TreeNode {
    public static CreateRunNode(
        label: string,
        applications: DaprApplication[],
        daprClient: DaprClient): DaprRunNode {
        return new DaprRunNode(label, applications, daprClient);
    }

    public static CreateIndividualApplicationsNode(
        applications: DaprApplication[],
        daprClient: DaprClient) : DaprRunNode {
        return new DaprRunNode('Individual Applications', applications, daprClient, true);
    }

    private constructor(
        private readonly label: string,
        public readonly applications: DaprApplication[],
        private readonly daprClient: DaprClient,
        private readonly isIndividualApplicationsNode: boolean = false) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.label, vscode.TreeItemCollapsibleState.Expanded);

        item.contextValue = ['run', this.applications.some(application => application.appPid !== undefined) ? 'attachable' : ''].join(' ');
        
        if (!this.isIndividualApplicationsNode) {
            item.iconPath = new vscode.ThemeIcon('layers');
        }

        return Promise.resolve(item);
    }

    getChildren(): TreeNode[] {
        return this.applications.map(application => new DaprApplicationNode(application, this.daprClient));
    }
}