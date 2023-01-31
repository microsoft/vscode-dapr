/* eslint-disable @typescript-eslint/no-unsafe-call */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as path from 'path';
import * as vscode from 'vscode';
import { DaprApplication, DaprApplicationProvider } from '../../services/daprApplicationProvider';
import TreeNode from '../treeNode';
import { DaprInstallationManager } from '../../services/daprInstallationManager';
import { UserInput } from '../../services/userInput';
import { DaprClient } from '../../services/daprClient';
import { Subscription } from 'rxjs';
import { DaprRunNode } from './daprRunNode';

export default class DaprApplicationTreeDataProvider extends vscode.Disposable implements vscode.TreeDataProvider<TreeNode> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeNode | null | undefined>();
    private readonly applicationProviderListener: Subscription;
    private applications: DaprApplication[] = [];

    constructor(
        private readonly applicationProvider: DaprApplicationProvider,
        private readonly daprClient: DaprClient,
        private readonly installationManager: DaprInstallationManager,
        private readonly ui: UserInput) {
        super(() => {
            this.applicationProviderListener.unsubscribe();
            this.onDidChangeTreeDataEmitter.dispose();
        });

        this.applicationProviderListener =
            this.applicationProvider
                .applications
                .subscribe(
                    applications => {
                        this.applications = applications;
                        this.onDidChangeTreeDataEmitter.fire(undefined);
                    });
    }

    get onDidChangeTreeData(): vscode.Event<TreeNode | null | undefined> | undefined {
        return this.onDidChangeTreeDataEmitter.event;
    }
    
    getTreeItem(element: TreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();
    }

    async getChildren(element?: TreeNode): Promise<TreeNode[]> {
        if (element) {
            return element.getChildren?.() ?? [];
        } else {
            const isInitialized = await this.installationManager.isInitialized();

            if (isInitialized) {
                await this.ui.executeCommand('setContext', 'vscode-dapr.views.applications.state', 'notRunning');
            } else {
                const isInstalled = await this.installationManager.isInstalled();
    
                if (isInstalled) {
                    await this.ui.executeCommand('setContext', 'vscode-dapr.views.applications.state', 'notInitialized');
                } else {
                    await this.ui.executeCommand('setContext', 'vscode-dapr.views.applications.state', 'notInstalled');
                }
            }
    
            const runs = this.getRuns();

            // NOTE: Returning zero children indicates to VS Code that is should display a "welcome view".
            //       The one chosen for display depends on the context set above.

            return runs;
        }
    }

    private getRuns(): DaprRunNode[] {
        const runs: { [key: string]: DaprApplication[] } = {};
        const individualApps: DaprApplication[] = [];

        for (const application of this.applications) {
            if (application.runTemplatePath) {
                // TODO: Grouping needs to be done via <PPID, RunTemplatePath> to allow for multiple runs.
                const name = path.basename(path.dirname(application.runTemplatePath));

                const applications = runs[name] ?? [];

                applications.push(application);

                runs[name] = applications;
            } else {
                individualApps.push(application);
            }
        }

        return Object
            .keys(runs)
            .map(name => new DaprRunNode(name, runs[name], this.daprClient))
            .concat(new DaprRunNode('Individual Applications', individualApps, this.daprClient));
    }
}