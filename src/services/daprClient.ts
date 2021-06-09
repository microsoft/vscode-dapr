// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as url from 'url';
import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { DaprApplication } from "./daprApplicationProvider";
import { HttpClient, HttpResponse } from './httpClient';
import { getLocalizationPathForFile } from '../util/localization';
import { Process } from '../util/process'; 


const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface DaprClient {
    invokeGet(application: DaprApplication, method: string, token?: vscode.CancellationToken): Promise<unknown>;
    invokePost(application: DaprApplication, method: string, payload?: unknown, token?: vscode.CancellationToken): Promise<unknown>;
    publishMessage(application: DaprApplication, pubSubName: string, topic: string, payload?: unknown, token?: vscode.CancellationToken): Promise<void>;
    stopApp(application: DaprApplication): Promise<unknown>;
}

function manageResponse(response: HttpResponse): unknown {
    if (response.status >= 300 && response.status < 400) {
        const redirectionUrl = response.headers['location'];

        if (redirectionUrl) {
            const parsedRedirectionUrl = new url.URL(redirectionUrl);

            if (parsedRedirectionUrl.protocol === 'https:'
                && (parsedRedirectionUrl.hostname === 'localhost' || parsedRedirectionUrl.hostname === '127.0.0.1')) {
                throw new Error(localize('services.daprClient.httpsRedirectError', 'The application redirected to the local HTTPS endpoint \'{0}\'. This is usually a mistake in application configuration. Dapr expects to invoke the application via HTTP.', redirectionUrl));
            }
        }
        
        return localize('services.daprClient.redirectionResponse', '{0} Redirected to \'{1}\'', response.status, redirectionUrl);
    }

    return response.data;
}

export default class HttpDaprClient implements DaprClient {
    constructor(private readonly httpClient: HttpClient) {
    }

    async invokeGet(application: DaprApplication, method: string, token?: vscode.CancellationToken | undefined): Promise<unknown> {
        const originalUrl = `http://localhost:${application.httpPort}/v1.0/invoke/${application.appId}/method/${method}`;

        const response = await this.httpClient.get(originalUrl, { allowRedirects: false }, token);

        return manageResponse(response);
    }

    async invokePost(application: DaprApplication, method: string, payload?: unknown, token?: vscode.CancellationToken | undefined): Promise<unknown> {
        const url = `http://localhost:${application.httpPort}/v1.0/invoke/${application.appId}/method/${method}`;

        const response = await this.httpClient.post(url, payload, { allowRedirects: false, json: true }, token);

        return manageResponse(response);
    }

    async publishMessage(application: DaprApplication, pubSubName: string, topic: string, payload?: unknown, token?: vscode.CancellationToken): Promise<void> {
        const url = `http://localhost:${application.httpPort}/v1.0/publish/${pubSubName}/${topic}`;

        await this.httpClient.post(url, payload, { json: true }, token);
    }

    async stopApp(application: DaprApplication): Promise<void> {
        const temp = await Process.exec(`dapr stop --app-id ${application.appId}`);
        
        if(temp.code == 0) {
            void vscode.window.showInformationMessage(temp.stdout);
        } else {
            void vscode.window.showInformationMessage(temp.stderr);
        }
    }
}
