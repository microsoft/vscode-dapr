import * as nls from 'vscode-nls';
import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { getLocalizationPathForFile } from '../../util/localization';
import { DaprKeyNode } from './daprKeyNode';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface Key {
    readonly name: string;

    getValue(): Promise<string | undefined>;
}

export class DaprStateNode implements TreeNode {
    constructor(private readonly keyProvider: () => Promise<Key[]>) {
    }

    async getChildren(): Promise<TreeNode[]> {
        const keys = await this.keyProvider();

        return keys.map(key => new DaprKeyNode(key));
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(localize('views.applications.daprStateNode.label', 'State'), vscode.TreeItemCollapsibleState.Collapsed);

        item.contextValue = 'state';

        return Promise.resolve(item); 
    }
}
