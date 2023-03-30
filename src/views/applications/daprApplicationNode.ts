// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from "../treeNode";
import { DaprApplication } from '../../services/daprApplicationProvider';
import DaprComponentsNode from "./daprComponentsNode";

export default class DaprApplicationNode implements TreeNode {
    constructor(
        public readonly application: DaprApplication,
        private readonly componentsNodeFactory: (application: DaprApplication) => DaprComponentsNode) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.application.appId, vscode.TreeItemCollapsibleState.Collapsed);

        item.contextValue = [
            'application',
            this.application.appPid !== undefined ? 'attachable' : '',
            this.application.appPort !== undefined && this.application.appPort > 0 ? 'browsable' : '',
            this.application.runTemplatePath ? 'hasLogs' : ''
        ].join(' ');
        item.iconPath = new vscode.ThemeIcon(this.application.appPid !== undefined ? 'server-process' : 'browser');

        return Promise.resolve(item);
    }

    getChildren(): TreeNode[] {
        return [this.componentsNodeFactory(this.application)];
    }
}