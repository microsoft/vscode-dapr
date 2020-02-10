// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios from 'axios';
import * as vscode from 'vscode';

export interface HttpResponse {
    data: unknown;
}

export interface HttpPostOptions {
    json?: boolean;
}

export interface HttpClient {
    get(url: string, token?: vscode.CancellationToken): Promise<HttpResponse>;
    post(url: string, data?: unknown, options?: HttpPostOptions, token?: vscode.CancellationToken): Promise<HttpResponse>;
}

export default class AxiosHttpClient implements HttpClient {
    async get(url: string, token?: vscode.CancellationToken): Promise<HttpResponse> {
        const cancelTokenSource = axios.CancelToken.source();
        const tokenListener = token ? token.onCancellationRequested(() => cancelTokenSource.cancel()) : undefined;

        try {
            const response = await axios.get(url, { cancelToken: cancelTokenSource.token });

            return { data: response.data };
        } finally {
            if (tokenListener) {
                tokenListener.dispose();
            }
        }
    }

    async post(url: string, data?: unknown, options?: HttpPostOptions, token?: vscode.CancellationToken): Promise<HttpResponse> {
        const cancelTokenSource = axios.CancelToken.source();
        const tokenListener = token ? token.onCancellationRequested(() => cancelTokenSource.cancel()) : undefined;

        try {
            const response = await axios.post(
                url,
                options?.json ? JSON.stringify(data) : data,
                {
                    cancelToken: cancelTokenSource.token,
                    headers: {
                        'content-type': options?.json ? 'application/json' : undefined
                    }
                });

            return { data: response.data };
        } finally {
            if (tokenListener) {
                tokenListener.dispose();
            }
        }
    }
}