// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';

export async function withAggregateTokens<T>(callback: (token: vscode.CancellationToken) => Promise<T>, ...tokens: (vscode.CancellationToken | undefined)[]): Promise<T> {
    const cancellationTokenSource = new AggregateCancellationTokenSource(...tokens);
    try {
        return await callback(cancellationTokenSource.token);
    } finally {
        cancellationTokenSource.dispose();
    }
}

export default class AggregateCancellationTokenSource extends vscode.CancellationTokenSource {
    private readonly listeners: (vscode.Disposable | undefined)[];

    constructor(...tokens: (vscode.CancellationToken | undefined)[]) {
        super();

        this.listeners = tokens.map(token => token?.onCancellationRequested(() => this.cancel()));
    }

    dispose() {
        for (const listener of this.listeners) {
            listener?.dispose();
        }

        super.dispose();
    }
}