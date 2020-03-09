// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { localize } from '../../util/localize';
import { DaprInstallationManager } from '../../services/daprInstallationManager';

export default class NoApplicationsRunningNode implements TreeNode {
    constructor(private readonly installationManager: DaprInstallationManager) {
    }

    async getTreeItem(): Promise<vscode.TreeItem> {
        let label = localize('views.noApplicationsRunningNode.notInstalledLabel', 'The Dapr CLI and runtime do not appear to be installed.');

        const version = await this.installationManager.getVersion();
        
        if (version && version.cli) {
            label = localize('views.noApplicationsRunningNode.notInitializedLabel', 'The Dapr runtime does not appear to be initialized.');

            const isInitialized = await this.installationManager.isInitialized();

            if (isInitialized) {
                label = localize('views.noApplicationsRunningNode.label', 'No Dapr applications are running.')
            }
        }

        const treeItem = new vscode.TreeItem(label);

        treeItem.iconPath = new vscode.ThemeIcon('warning');

        return Promise.resolve(treeItem);
    }
}
