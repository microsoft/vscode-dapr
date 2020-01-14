import * as vscode from 'vscode';

export interface DependsOn {
    type?: string;
}

export interface TaskDefinition extends vscode.TaskDefinition {
    label?: string;
    dependsOn?: string | string[] | DependsOn;
}
