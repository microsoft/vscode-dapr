// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from "vscode";
import * as nls from 'vscode-nls';
import { DaprApplication } from "../../services/daprApplicationProvider";
import { DaprClient } from "../../services/daprClient";
import TreeNode from "../treeNode";
import DaprApplicationNode from "./daprApplicationNode";
import { getLocalizationPathForFile } from '../../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export class DaprRunNode implements TreeNode {
    public static CreateRunNode(
        label: string,
        runTemplatePath: string,
        applications: DaprApplication[],
        daprClient: DaprClient): DaprRunNode {
        return new DaprRunNode(label, runTemplatePath, applications, daprClient);
    }

    public static CreateIndividualApplicationsNode(
        applications: DaprApplication[],
        daprClient: DaprClient) : DaprRunNode {
        return new DaprRunNode(localize('views.applications.daprRunNode.individualApplicationsLabel', 'Individual Applications'), undefined, applications, daprClient, true);
    }

    private constructor(
        public readonly label: string,
        public readonly runTemplatePath: string | undefined,
        public readonly applications: DaprApplication[],
        private readonly daprClient: DaprClient,
        private readonly isIndividualApplicationsNode: boolean = false) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.label, vscode.TreeItemCollapsibleState.Expanded);

        item.contextValue = [
            'run',
            this.applications.some(application => application.appPid !== undefined) ? 'attachable' : '',
            this.runTemplatePath !== undefined ? 'stoppable' : ''
        ].join(' ');
        
        if (!this.isIndividualApplicationsNode) {
            item.iconPath = new vscode.ThemeIcon('layers');
        }

        return Promise.resolve(item);
    }

    getChildren(): TreeNode[] {
        return this.applications.map(application => new DaprApplicationNode(application, this.daprClient));
    }
}