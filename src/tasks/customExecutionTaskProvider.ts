import * as vscode from 'vscode';
import TaskPseudoterminal from './taskPseudoterminal';
import { PseudoterminalWriter } from './taskPseudoterminalWriter';

export default class CustomExecutionTaskProvider implements vscode.TaskProvider {
    constructor(private readonly callback: (definition: vscode.TaskDefinition, writer: PseudoterminalWriter, token?: vscode.CancellationToken) => Promise<number | void>) {
    }

    provideTasks(token?: vscode.CancellationToken | undefined): vscode.ProviderResult<vscode.Task[]> {
        return [];
    }
    
    resolveTask(task: vscode.Task, token?: vscode.CancellationToken | undefined): vscode.ProviderResult<vscode.Task> {
        return new vscode.Task(
            task.definition,
            task.scope || vscode.TaskScope.Workspace,
            task.name,
            task.source,
            new vscode.CustomExecution(
                () => Promise.resolve(
                    new TaskPseudoterminal((writer, token) => this.callback(task.definition, writer, token)))),
            task.problemMatchers);
    }
}