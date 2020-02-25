// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { IAzureUserInput, IAzureQuickPickOptions, IActionContext, AzureWizardPromptStep, AzureWizard } from 'vscode-azureextensionui';

interface WizardOptions<T> {
    hideStepCount?: boolean;
    initialContext?: Partial<T>;
    title: string;
}

export interface WizardStep<T> {
    (context: Partial<T>): Promise<Partial<T>>;
}

export interface UserInput {
    showInputBox(options: vscode.InputBoxOptions): Promise<string>;
    showQuickPick<T extends vscode.QuickPickItem>(items: T[] | Thenable<T[]>, options: IAzureQuickPickOptions): Promise<T>;
    showWizard<T>(options: WizardOptions<T>, ...steps: (WizardStep<T> | undefined)[]): Promise<T>;
    withProgress<T>(title: string, task: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Promise<T>): Promise<T>;
}

function isStep<T>(step: WizardStep<T> | undefined): step is WizardStep<T> {
    return step !== undefined;
}

interface WizardContext<T> extends IActionContext {
    stepContext: Partial<T>;
}

class WizardPromptStep<T> extends AzureWizardPromptStep<WizardContext<T>> {
    constructor(private readonly step: WizardStep<T>) {
        super();
    }

    async prompt(wizardContext: WizardContext<T>): Promise<void> {
        wizardContext.stepContext = await this.step(wizardContext.stepContext);
    }
    
    shouldPrompt(): boolean {
        return true;
    }
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

    async showWizard<T>(options: WizardOptions<T>, ...steps: (WizardStep<T> | undefined)[]): Promise<T> {
        const filteredSteps = steps.filter(isStep);

        // NOTE: AzureWizard<T> requires T extend IActionContext in order to log some telemetry metadata about the last performed step.
        //       This seems like an onerous requirement, so we fake an IActionContext to make the wizard happy.

        const wizardContext: WizardContext<T> = {
            errorHandling: {
                issueProperties: {}
            },
            stepContext: options.initialContext ?? {},
            telemetry: {
                measurements: {},
                properties: {}
            }
        };

        const wizard = new AzureWizard(
            wizardContext,
            {
                hideStepCount: options.hideStepCount,
                promptSteps: filteredSteps.map(step => new WizardPromptStep(step)),
                title: options.title
            });

        await wizard.prompt();

        return wizardContext.stepContext as T;
    }

    async withProgress<T>(title: string, task: (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined }>, token: vscode.CancellationToken) => Promise<T>): Promise<T> {
        return await vscode.window.withProgress({ cancellable: true, location: vscode.ProgressLocation.Notification, title }, task);
    }
}