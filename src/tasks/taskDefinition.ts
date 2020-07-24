// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export interface DependsOn {
    type?: string;
}

export interface TaskDefinition extends vscode.TaskDefinition {
    cwd?: string;
    dependsOn?: string | string[] | DependsOn;
    label?: string;
}
