// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { DaprComponentMetadata } from '../../services/daprClient';
import TreeNode from "../treeNode";
import { DaprStateStoreProvider, RedisDaprStateStoreProvider } from '../../services/daprStateStoreProvider';
import { DaprKeyNode } from './daprKeyNode';

export default class DaprComponentMetadataNode implements TreeNode {
    private readonly stateStoreProvider: DaprStateStoreProvider = new RedisDaprStateStoreProvider();

    constructor(
        public readonly daprComponentMetadata: DaprComponentMetadata,
        private readonly themeIconId: string) {
    }

    async getChildren(): Promise<TreeNode[]> {
        const stateStore = await this.stateStoreProvider.getStateStore(this.daprComponentMetadata.name);

        // TODO: Push down appId.
        const keys = await stateStore.getKeys("order-processor");

        return keys.map(key => new DaprKeyNode(key));
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const isStateStore = this.daprComponentMetadata.type.startsWith('state.');
        const item = new vscode.TreeItem(this.daprComponentMetadata.name, isStateStore ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

        item.contextValue = 'metadata';
        item.iconPath = new vscode.ThemeIcon(this.themeIconId);

        return Promise.resolve(item); 
    }
}