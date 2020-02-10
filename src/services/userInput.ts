// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { IAzureUserInput, IAzureQuickPickOptions } from 'vscode-azureextensionui';

export interface UserInput {
    showInputBox(options: vscode.InputBoxOptions): Promise<string>;
    showQuickPick<T extends vscode.QuickPickItem>(items: T[] | Thenable<T[]>, options: IAzureQuickPickOptions): Promise<T>;
    withProgress<T>(title: string, task: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Promise<T>): Promise<T>;
}

export class AggregateUserInput implements UserInput {
    constructor(private readonly ui: IAzureUserInput) {
    }

    showInputBox(options: vscode.InputBoxOptions): Promise<string> {
        return this.ui.showInputBox(options);
    }

    showQuickPick<T extends vscode.QuickPickItem>(items: T[] | Thenable<T[]>, options: IAzureQuickPickOptions): Promise<T> {
        return this.ui.showQuickPick(items, options);
    }

    async withProgress<T>(title: string, task: (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined }>, token: vscode.CancellationToken) => Promise<T>): Promise<T> {
        return await vscode.window.withProgress({ cancellable: true, location: vscode.ProgressLocation.Notification, title }, task);
    }
}