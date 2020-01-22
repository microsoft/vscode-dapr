import * as vscode from 'vscode';
import TaskPseudoterminalWriter, { PseudoterminalWriter } from './taskPseudoterminalWriter';

export type TaskPseudoterminalCallback = (writer: PseudoterminalWriter, cts: vscode.CancellationToken) => Promise<number | void>;

export default class TaskPseudoterminal extends vscode.Disposable implements vscode.Pseudoterminal {
    private readonly closeEmitter: vscode.EventEmitter<number | void> = new vscode.EventEmitter<number | void>();
    private readonly writeEmitter: vscode.EventEmitter<string> = new vscode.EventEmitter<string>();
    private readonly cts: vscode.CancellationTokenSource = new vscode.CancellationTokenSource();

    constructor(private readonly callback: TaskPseudoterminalCallback) {
        super(
            () => {
                this.close();

                this.closeEmitter.dispose();
                this.writeEmitter.dispose();
                this.cts.dispose();
            });
    }

    readonly onDidClose: vscode.Event<number | void> = this.closeEmitter.event;
    public readonly onDidWrite: vscode.Event<string> = this.writeEmitter.event;

    open(): void {
        this.callback(
            new TaskPseudoterminalWriter(
                (output: string) => {
                    this.writeEmitter.fire(output);
                }),
            this.cts.token)
            .then(value => this.closeWithValue(value))
            .catch(() => this.closeWithValue());
    }

    close(): void {
        this.closeWithValue();
    }

    private closeWithValue(value: number | void): void {
        this.cts.cancel();
        this.closeEmitter.fire(value);
    }
}