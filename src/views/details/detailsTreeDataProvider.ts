// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import * as nls from 'vscode-nls'
import { DaprApplication } from '../../services/daprApplicationProvider';
import DaprDetailsNode from './daprDetailsNode';
import { DaprComponentMetadata } from '../../services/daprClient';
import { getLocalizationPathForFile } from '../../util/localization';
import { Observable, Subscription } from 'rxjs';
import DaprApplicationNode from '../applications/daprApplicationNode';
import DaprComponentMetadataNode from '../applications/daprComponentMetadataNode';
import { DaprKeyNode } from '../applications/daprKeyNode';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export default class DetailsTreeDataProvider extends vscode.Disposable implements vscode.TreeDataProvider<TreeNode> {    
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeNode | null | undefined>();
    private readonly applicationProviderListener: Subscription;
    private selectedItems: readonly TreeNode[] = [];
    private details: DaprDetailItem[] = [];

    constructor(
        applicationsSelection: Observable<readonly TreeNode[]>) {
        super(() => {
            this.applicationProviderListener.unsubscribe();
            this.onDidChangeTreeDataEmitter.dispose();
        });

        this.applicationProviderListener =
            applicationsSelection
                .subscribe(
                    selectedItems => {
                        this.selectedItems = selectedItems;
                        this.onDidChangeTreeDataEmitter.fire(undefined);
                    });
    }

    get onDidChangeTreeData(): vscode.Event<TreeNode | null | undefined> | undefined {
        return this.onDidChangeTreeDataEmitter.event;
    }

    getTreeItem(element: TreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();    
    }

    getChildren(): Promise<TreeNode[]> {
        if (this.selectedItems.length === 1) {
            const item = this.selectedItems[0];

            if (item instanceof DaprApplicationNode) {
                return Promise.resolve(this.setAppDetails(item.application))
            } else if (item instanceof DaprComponentMetadataNode) {
                return Promise.resolve(this.setComponentDetails(item.daprComponentMetadata));
            } else if (item instanceof DaprKeyNode) {
                return DetailsTreeDataProvider.setKeyDetails(item);
            }
        }

        return Promise.resolve([]);
    }

    setAppDetails(application: DaprApplication) : DaprDetailsNode[] {
        const appID = localize('views.details.detailsTreeDataProvider.appID', 'App ID');
        const appPort = localize('views.details.detailsTreeDataProvider.appPort', 'App Port');
        const httpPort = localize('views.details.detailsTreeDataProvider.httpPort', 'Dapr HTTP Port');
        const grpcPort = localize('views.details.detailsTreeDataProvider.grpcPort', 'Dapr GRPC Port');
        const pid = localize('views.details.detailsTreeDataProvider.pid', 'Dapr Process ID');

        return [
            new DaprDetailsNode(appID, application?.appId.toString()), 
            new DaprDetailsNode(appPort, application?.appPort !== undefined ? application?.appPort.toString() : "None"),
            new DaprDetailsNode(httpPort, application?.httpPort.toString()),
            new DaprDetailsNode(grpcPort, application?.grpcPort.toString()), 
            new DaprDetailsNode(pid, application?.pid.toString()) 
        ];
    }

    setComponentDetails(component: DaprComponentMetadata) : DaprDetailsNode[] {
        const name = localize('views.details.detailsTreeDataProvider.name', 'Name');
        const type = localize('views.details.detailsTreeDataProvider.type', 'Type');
        const version = localize('views.details.detailsTreeDataProvider.version', 'Version');

        return [
            new DaprDetailsNode(name, component.name), 
            new DaprDetailsNode(type, component.type),
            new DaprDetailsNode(version, component.version)
        ];
    }

    private static async setKeyDetails(keyNode: DaprKeyNode) : Promise<DaprDetailsNode[]> {
        const value = await keyNode.key.getValue();

        return [
            new DaprDetailsNode(localize('views.details.detailsTreeDataProviderKeyLabel', 'Key'), keyNode.key.name),
            new DaprDetailsNode(localize('views.details.detailsTreeDataProviderValueLabel', 'Value'), value ?? localize('views.details.detailsTreeDataProviderValueLabelNone', 'None'))
        ];
    }
}

export interface DaprDetailItem {
    label: string
    value: string
}