// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import TreeNode from "../treeNode";
import { DaprApplication } from '../../services/daprApplicationProvider';
import DaprMetadataNode from './daprMetadataNode';
import { DaprClient } from '../../services/daprClient';
import { getLocalizationPathForFile } from '../../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));


export default class DaprComponentsNode implements TreeNode {
    constructor(private readonly application: DaprApplication, private readonly daprClient: DaprClient) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const label = localize('views.applications.daprComponentsNode.componentNode', 'Components');

        const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);

        item.contextValue = 'components';

        item.iconPath = new vscode.ThemeIcon('archive');

        return Promise.resolve(item);
    }

    async getChildren(): Promise<TreeNode[]> {
        const label = localize('views.applications.daprComponentsNode.noComponents', 'There are no components in use.');
        const responseData = await this.daprClient.getMetadata(this.application);
        const components = responseData.components;
        if(components.length > 0) {
            return components.map(comp => new DaprMetadataNode(comp.name, 'database'));
        }
        return [new DaprMetadataNode(label, 'warning')];
    }
}

