// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { Observable } from 'rxjs';
import * as nls from 'vscode-nls';
import { getLocalizationPathForFile } from './localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export function fromCancellationToken(cancellationToken: vscode.CancellationToken): Observable<void> {
    return new Observable<void>(
        subscriber => {
            const listener = cancellationToken.onCancellationRequested(
                () => {
                    subscriber.error(new Error(localize('util.observableCancellationToken.cancellationRequested', 'Cancellation was requested.')));
                });

            return () => {
                listener.dispose()
            };
        });
}
