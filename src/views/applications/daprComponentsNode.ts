// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import TreeNode from "../treeNode";
import { DaprApplication } from '../../services/daprApplicationProvider';
import DaprMetadataNode from './daprMetadataNode';
import { DaprClient, DaprMetadata } from '../../services/daprClient';
import { getLocalizationPathForFile } from '../../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));


export default class DaprComponentsNode implements TreeNode {
    constructor(public readonly application: DaprApplication, public readonly daprClient: DaprClient) {
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
        const responseData = await this.getMetadata(this.application);
        const components = responseData.components;
        if(components.length > 0) {
            return components.map(comp => new DaprMetadataNode(comp.name, 'database'));
        }
        return [new DaprMetadataNode(label, 'warning')];
    }

    private async getMetadata(application: DaprApplication, token?: vscode.CancellationToken | undefined): Promise<DaprMetadata>  {
        //const daprClient = new HttpDaprClient(new AxiosHttpClient());
        return await this.daprClient.getMetadata(application, token);
    }
    
}

