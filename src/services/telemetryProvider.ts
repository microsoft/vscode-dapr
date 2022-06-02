// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { callWithTelemetryAndErrorHandling, IActionContext, registerCommand, TelemetryProperties } from '@microsoft/vscode-azext-utils';
import TreeNode from '../views/treeNode';

interface ContextCommandTelemetryProperties extends TelemetryProperties {
    source: 'context' | 'palette';
}

export interface TelemetryProvider {
    callWithTelemetry<T>(eventName: string, action: (context: IActionContext) => Promise<T>): Promise<T | undefined>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerCommandWithTelemetry(commandId: string, callback: (context: IActionContext, ...args: any[]) => unknown): void;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerContextCommandWithTelemetry<T extends TreeNode>(commandId: string, callback: (context: IActionContext, node: T | undefined, ...args: any[]) => unknown): void;
}

export default class AzureTelemetryProvider implements TelemetryProvider {
    callWithTelemetry<T>(eventName: string, action: (context: IActionContext) => Promise<T>): Promise<T | undefined> {
        return callWithTelemetryAndErrorHandling<T>(eventName, action);
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerCommandWithTelemetry(commandId: string, callback: (context: IActionContext, ...args: any[]) => unknown): void {
        registerCommand(commandId, callback);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerContextCommandWithTelemetry<T extends TreeNode>(commandId: string, callback: (context: IActionContext, node: T | undefined, ...args: any[]) => unknown): void {
        this.registerCommandWithTelemetry(
            commandId,
            (context, node, ...args) => {
                const properties = context.telemetry.properties as ContextCommandTelemetryProperties;

                properties.source = node ? 'context' : 'palette';

                return callback(context, node, ...args);
            });
    }
}
