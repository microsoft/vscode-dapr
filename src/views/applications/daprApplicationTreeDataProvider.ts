import * as vscode from 'vscode';
import { DaprApplicationProvider } from '../../services/daprApplicationProvider';
import TreeNode from './treeNode';
import DaprApplicationNode from './daprApplicationNode';
import NoApplicationsRunningNode from './noApplicationsRunningNode';

export default class DaprApplicationTreeDataProvider extends vscode.Disposable implements vscode.TreeDataProvider<TreeNode> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeNode | null | undefined>();
    private readonly applicationProviderListener: vscode.Disposable;

    constructor(private readonly applicationProvider: DaprApplicationProvider) {
        super(() => {
            this.applicationProviderListener.dispose();
            this.onDidChangeTreeDataEmitter.dispose();
        });

        this.applicationProviderListener = this.applicationProvider.onDidChange(
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

    async getChildren(): Promise<TreeNode[]> {
        const applications = await this.applicationProvider.getApplications();

        if (applications.length > 0) {
            return applications.map(application => new DaprApplicationNode(application));
        } else {
            return [ new NoApplicationsRunningNode() ];
        }
    }
}