// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { IAzureUserInput, IAzureQuickPickOptions } from 'vscode-azureextensionui';

export interface WizardStep<T> {
    (context: T): Promise<T>;
}

export interface UserInput {
    showInputBox(options: vscode.InputBoxOptions): Promise<string>;
    showQuickPick<T extends vscode.QuickPickItem>(items: T[] | Thenable<T[]>, options: IAzureQuickPickOptions): Promise<T>;
    showWizard<T>(context: Partial<T>, ...steps: WizardStep<T>[]): Promise<T>;
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

    async showWizard<T>(context: Partial<T>, ...steps: WizardStep<T>[]): Promise<T> {
        const currentSteps = [...(steps ?? [])];

        let result = context as T;
        let currentStep = currentSteps.shift();

        while (currentStep) {
            result = await currentStep(result);

            currentStep = currentSteps.shift();
        }

        return result;
    }

    async withProgress<T>(title: string, task: (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined }>, token: vscode.CancellationToken) => Promise<T>): Promise<T> {
        return await vscode.window.withProgress({ cancellable: true, location: vscode.ProgressLocation.Notification, title }, task);
    }
}