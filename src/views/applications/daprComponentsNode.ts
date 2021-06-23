// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from "../treeNode";
import { DaprApplication } from '../../services/daprApplicationProvider';
import DaprMetadataNode from './daprMetadataNode';
import AxiosHttpClient from '../../services/httpClient';
import HttpDaprClient, { DaprMetadata } from '../../services/daprClient';


export default class DaprComponentsNode implements TreeNode {
    constructor(public readonly metadata: string, public readonly application: DaprApplication) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(this.metadata, vscode.TreeItemCollapsibleState.Collapsed);

        item.contextValue = 'components';

        item.iconPath = new vscode.ThemeIcon('archive');

        return Promise.resolve(item);
    }

    async getChildren(): Promise<TreeNode[]> {
        const responseData = await this.getMetadata(this.application);
        const components = responseData.components;
        return components.map(comp => new DaprMetadataNode(comp.name));
    }

    private async getMetadata(application: DaprApplication, token?: vscode.CancellationToken | undefined): Promise<DaprMetadata>  {
        const daprClient = new HttpDaprClient(new AxiosHttpClient());
        return await daprClient.getMetadata(application, token);
    }
    
}

