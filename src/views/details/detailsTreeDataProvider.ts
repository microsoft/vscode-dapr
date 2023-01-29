// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import * as nls from 'vscode-nls'
import { DaprApplication, DaprApplicationProvider } from '../../services/daprApplicationProvider';
import DaprDetailsNode from './daprDetailsNode';
import { DaprComponentMetadata } from '../../services/daprClient';
import { getLocalizationPathForFile } from '../../util/localization';
import { Observable, Subscription } from 'rxjs';
import DaprApplicationNode from '../applications/daprApplicationNode';
import createScaffoldDaprComponentsCommand from '../../commands/scaffoldDaprComponents';
import DaprComponentMetadataNode from '../applications/daprComponentMetadataNode';

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

    getChildren(): TreeNode[] {
        if (this.selectedItems.length === 1) {
            const item = this.selectedItems[0];

            if (item instanceof DaprApplicationNode) {
                return this.setAppDetails(item.application)
            } else if (item instanceof DaprComponentMetadataNode) {
                return this.setComponentDetails(item.daprComponentMetadata);
            }
        }

        return [];
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
}

export interface DaprDetailItem {
    label: string
    value: string
}