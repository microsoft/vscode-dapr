// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import TreeNode from '../treeNode';
import * as nls from 'vscode-nls'
import { DaprApplication, DaprApplicationProvider } from '../../services/daprApplicationProvider';
import DaprDetailsNode from './daprDetailsNode';
import { DaprComponentMetadata } from '../../services/daprClient';
import { getLocalizationPathForFile } from '../../util/localization';
import { Subscription } from 'rxjs';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export default class DetailsTreeDataProvider extends vscode.Disposable implements vscode.TreeDataProvider<TreeNode> {    
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeNode | null | undefined>();
    private readonly applicationProviderListener: Subscription;
    private details: DaprDetailItem[] = [];

    constructor(
        private readonly applicationProvider: DaprApplicationProvider) {
        super(() => {
            this.applicationProviderListener.unsubscribe();
            this.onDidChangeTreeDataEmitter.dispose();
        });

        this.applicationProviderListener =
            this.applicationProvider
                .applications
                .subscribe(
                    () => {
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
        return this.details.map(detail => new DaprDetailsNode(detail.label, detail.value))
    }

    setAppDetails(application: DaprApplication | undefined) : void {
        const appID = localize('views.details.detailsTreeDataProvider.appID', 'App ID');
        const appPort = localize('views.details.detailsTreeDataProvider.appPort', 'App Port');
        const httpPort = localize('views.details.detailsTreeDataProvider.httpPort', 'Dapr HTTP Port');
        const grpcPort = localize('views.details.detailsTreeDataProvider.grpcPort', 'Dapr GRPC Port');
        const pid = localize('views.details.detailsTreeDataProvider.pid', 'Dapr Process ID');

        if(application !== undefined) {
            this.details = [
                {label: appID, value: application?.appId.toString()} as DaprDetailItem, 
                {label: appPort, value: application?.appPort !== undefined ? application?.appPort.toString() : "None"} as DaprDetailItem,
                {label: httpPort, value: application?.httpPort.toString()} as DaprDetailItem,
                {label: grpcPort, value: application?.grpcPort.toString()} as DaprDetailItem, 
                {label: pid, value: application?.pid.toString()} as DaprDetailItem, 
            ]
        }
    }

    setComponentDetails(component: DaprComponentMetadata | undefined) : void {
        const name = localize('views.details.detailsTreeDataProvider.name', 'Name');
        const type = localize('views.details.detailsTreeDataProvider.type', 'Type');
        const version = localize('views.details.detailsTreeDataProvider.version', 'Version');
        if(component !== undefined) {
            this.details = [
                {label: name, value: component.name} as DaprDetailItem, 
                {label: type, value: component.type} as DaprDetailItem,
                {label: version, value: component.version} as DaprDetailItem]
        }
        
    }  
}

export interface DaprDetailItem {
    label: string
    value: string
}