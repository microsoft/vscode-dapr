// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { callWithTelemetryAndErrorHandling, IActionContext, registerCommand } from "vscode-azureextensionui";

export interface TelemetryProvider {
    callWithTelemetry<T>(eventName: string, action: (context: IActionContext) => Promise<T>): Promise<T | undefined>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerCommandWithTelemetry(commandId: string, callback: (context: IActionContext, ...args: any[]) => unknown): void;
}

export default class AzureTelemetryProvider implements TelemetryProvider {
    callWithTelemetry<T>(eventName: string, action: (context: IActionContext) => Promise<T>): Promise<T | undefined> {
        return callWithTelemetryAndErrorHandling<T>(eventName, action);
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerCommandWithTelemetry(commandId: string, callback: (context: IActionContext, ...args: any[]) => unknown): void {
        registerCommand(commandId, callback);
    }
}
