// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { DaprApplication } from "./daprApplicationProvider";
import { HttpClient } from './httpClient';

export interface DaprClient {
    invokeGet(application: DaprApplication, method: string, token?: vscode.CancellationToken): Promise<unknown>;
    invokePost(application: DaprApplication, method: string, payload?: unknown, token?: vscode.CancellationToken): Promise<unknown>;
}

export default class HttpDaprClient implements DaprClient {
    constructor(private readonly httpClient: HttpClient) {
    }

    async invokeGet(application: DaprApplication, method: string, token?: vscode.CancellationToken | undefined): Promise<unknown> {
        const url = `http://localhost:${application.httpPort}/v1.0/invoke/${application.appId}/method/${method}`;

        const response = await this.httpClient.get(url, token);

        return response.data;
    }

    async invokePost(application: DaprApplication, method: string, payload?: unknown, token?: vscode.CancellationToken | undefined): Promise<unknown> {
        const url = `http://localhost:${application.httpPort}/v1.0/invoke/${application.appId}/method/${method}`;

        const response = await this.httpClient.post(url, payload, { json: true }, token);

        return response.data;
    }
}