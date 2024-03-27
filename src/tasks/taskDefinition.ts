// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export interface DependsOn {
    type?: string;
}

export interface Dictionary<T> {
    [Key: string]: T;
}

export interface Options {
    env?: Dictionary<string>
}

export interface TaskDefinition extends vscode.TaskDefinition {
    cwd?: string;
    options?: Options;
    dependsOn?: string | string[] | DependsOn;
    label?: string;
}
