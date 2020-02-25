// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { UserInput } from '../../services/userInput';

export function reviewIssues(ui: UserInput): Thenable<boolean> {
    return ui.openExternal('https://aka.ms/vscode-dapr-help-review-issues');
}

const createReviewIssuesCommand = (ui: UserInput) => (): Thenable<boolean> => reviewIssues(ui);

export default createReviewIssuesCommand;
