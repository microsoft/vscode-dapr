// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { UserInput } from '../../services/userInput';

export function reportIssue(ui: UserInput): Thenable<void> {
    return ui.showIssueReporter();
}

const createReportIssueCommand = (ui: UserInput) => (): Thenable<void> => reportIssue(ui);

export default createReportIssueCommand;
