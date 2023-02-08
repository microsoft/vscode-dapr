// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface AsyncDisposable {
    dispose(): Promise<void>;
}
