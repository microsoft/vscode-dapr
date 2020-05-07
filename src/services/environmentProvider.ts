// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as os from 'os';

export interface EnvironmentProvider {
    readonly isWindows: boolean;
}

export default class NodeEnvironmentProvider implements EnvironmentProvider {
    get isWindows(): boolean {
        return os.platform() === 'win32';
    }
}
