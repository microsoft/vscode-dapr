// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import TreeNode from '../treeNode';
import { DaprInstallationManager } from '../../services/daprInstallationManager';
import { getLocalizationPathForFile } from '../../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export default class NoApplicationsRunningNode implements TreeNode {
    constructor(private readonly installationManager: DaprInstallationManager) {
    }

    async getTreeItem(): Promise<vscode.TreeItem> {
        let label: string;

        const isInitialized = await this.installationManager.isInitialized();

        if (isInitialized) {
            label = localize('views.applications.noApplicationsRunningNode.notRunning', 'No Dapr applications are running.')
        } else {
            const isInstalled = await this.installationManager.isInstalled();

            if (isInstalled) {
                label = localize('views.applications.noApplicationsRunningNode.notInitializedLabel', 'The Dapr runtime does not appear to be initialized.');
            } else {
                label = localize('views.applications.noApplicationsRunningNode.notInstalledLabel', 'The Dapr CLI and runtime do not appear to be installed.');
            }
        }

        const treeItem = new vscode.TreeItem(label);

        treeItem.iconPath = new vscode.ThemeIcon('warning');

        return Promise.resolve(treeItem);
    }
}
