// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios, { AxiosRequestConfig } from 'axios';
import * as vscode from 'vscode';

export interface HttpResponse {
    data: unknown;
    headers: { [key: string]: string };
    status: number;
}

export interface HttpGetOptions {
    allowRedirects?: boolean;
}

export interface HttpPostOptions {
    json?: boolean;
}

export interface HttpClient {
    get(url: string, options?: HttpGetOptions, token?: vscode.CancellationToken): Promise<HttpResponse>;
    post(url: string, data?: unknown, options?: HttpPostOptions, token?: vscode.CancellationToken): Promise<HttpResponse>;
}

export default class AxiosHttpClient implements HttpClient {
    async get(url: string, options?: HttpGetOptions, token?: vscode.CancellationToken): Promise<HttpResponse> {
        const cancelTokenSource = axios.CancelToken.source();
        const tokenListener = token ? token.onCancellationRequested(() => cancelTokenSource.cancel()) : undefined;

        const config: AxiosRequestConfig = {
            cancelToken: cancelTokenSource.token
        };

        if (options?.allowRedirects === false) {
            config.maxRedirects = 0;
            config.validateStatus = (status: number): boolean => status >= 200 && status < 400;
        }

        try {
            const response = await axios.get(url, config);

            return { data: response.data, headers: response.headers, status: response.status };
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

            return { data: response.data, headers: response.headers, status: response.status };
        } finally {
            if (tokenListener) {
                tokenListener.dispose();
            }
        }
    }
}