// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { DaprComponentMetadata } from '../../services/daprClient';
import TreeNode from "../treeNode";
import { DaprStateNode } from './daprStateNode';

export interface DaprApplicationStateStore {
    getKeys(): Promise<string[]>;
    getValue(key: string): Promise<string | undefined>;
}

export default class DaprComponentMetadataNode implements TreeNode {
    constructor(
        public readonly daprComponentMetadata: DaprComponentMetadata,
        private readonly stateStore: DaprApplicationStateStore) {
    }

    getChildren(): TreeNode[] {
        return [
            new DaprStateNode(
                async () => {
                    const keys = await this.stateStore.getKeys();

                    return keys.map(key => ({
                        name: key,
                        getValue: async () => {
                            return await this.stateStore.getValue(key);
                        }
                    }));
                })
        ];
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const isStateStore = this.daprComponentMetadata.type.startsWith('state.');
        const item = new vscode.TreeItem(this.daprComponentMetadata.name, isStateStore ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

        item.contextValue = 'metadata';
        item.iconPath = new vscode.ThemeIcon(DaprComponentMetadataNode.getThemeIconId(this.daprComponentMetadata.type));

        return Promise.resolve(item); 
    }

    private static getThemeIconId(componentType: string): string {
        const split = componentType.split('.');

        switch (split[0]) {
            case 'pubsub':
                return 'broadcast';
            case 'state':
                return 'database';
            default:
                return 'archive';
        }
    }
}