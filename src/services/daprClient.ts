// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as dapr from '@dapr/dapr';
import * as url from 'url';
import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { DaprApplication } from "./daprApplicationProvider";
import { HttpClient, HttpResponse } from './httpClient';
import { getLocalizationPathForFile } from '../util/localization';


const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface DaprClient {
    invokeGet(application: DaprApplication, method: string, token?: vscode.CancellationToken): Promise<unknown>;
    invokePost(application: DaprApplication, method: string, payload?: unknown, token?: vscode.CancellationToken): Promise<unknown>;
    publishMessage(application: DaprApplication, pubSubName: string, topic: string, payload?: unknown, token?: vscode.CancellationToken): Promise<void>;
    getMetadata(application: DaprApplication, token?: vscode.CancellationToken): Promise<DaprMetadata>;
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
    
    async getMetadata(application: DaprApplication, token?: vscode.CancellationToken | undefined): Promise<DaprMetadata>  {
        const originalUrl = `http://localhost:${application.httpPort}/v1.0/metadata`;

        const response = await this.httpClient.get(originalUrl, { allowRedirects: false }, token);
        
        return manageResponse(response) as DaprMetadata;
    }
}
    
export interface DaprMetadata {
    components: DaprComponentMetadata[];
  }
  
  export interface DaprComponentMetadata {
      name: string;
      type: string;
      version: string;
  }

export interface DaprClientApplication {
    grpcPort: number;
    httpPort: number;
}

export function getDaprClient(application: DaprClientApplication): dapr.DaprClient {
    return new dapr.DaprClient({
        daprHost: 'localhost',
        daprPort: application.grpcPort.toString(),
        communicationProtocol: dapr.CommunicationProtocolEnum.GRPC
    });
}
