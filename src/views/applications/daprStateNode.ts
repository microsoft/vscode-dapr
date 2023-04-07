import * as nls from 'vscode-nls';
import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import { getLocalizationPathForFile } from '../../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface Key {
    readonly name: string;
    readonly value: vscode.Uri;
}

export class DaprStateNode implements TreeNode {
    constructor(public readonly keyProvider: () => Promise<Key[]>) {
    }

    getTreeItem(): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(localize('views.applications.daprStateNode.label', 'State'));

        item.iconPath = new vscode.ThemeIcon('table');
        item.contextValue = 'state';

        return Promise.resolve(item); 
    }
}
