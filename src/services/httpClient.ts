// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios, { AxiosRequestConfig, CancelToken } from 'axios';
import * as vscode from 'vscode';

export interface HttpResponse {
    data: unknown;
    headers: { [key: string]: string };
    status: number;
}

export interface HttpOptions {
    allowRedirects?: boolean;
}

export interface HttpPostOptions extends HttpOptions {
    json?: boolean;
}

export interface HttpClient {
    get(url: string, options?: HttpOptions, token?: vscode.CancellationToken): Promise<HttpResponse>;
    post(url: string, data?: unknown, options?: HttpPostOptions, token?: vscode.CancellationToken): Promise<HttpResponse>;
}

function createConfig(allowRedirects: boolean | undefined, token: CancelToken): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
        cancelToken: token
    };

    if (allowRedirects === false) {
        config.maxRedirects = 0;
        config.validateStatus = (status: number): boolean => status >= 200 && status < 400;
    }

    return config;
}

export default class AxiosHttpClient implements HttpClient {
    async get(url: string, options?: HttpOptions, token?: vscode.CancellationToken): Promise<HttpResponse> {
        const cancelTokenSource = axios.CancelToken.source();
        const tokenListener = token ? token.onCancellationRequested(() => cancelTokenSource.cancel()) : undefined;

        try {
            const response = await axios.get<unknown>(url, createConfig(options?.allowRedirects, cancelTokenSource.token));

            return { data: response.data, headers: <{[key: string]: string}>response.headers, status: response.status };
        } finally {
            if (tokenListener) {
                tokenListener.dispose();
            }
        }
    }

    async post(url: string, data?: unknown, options?: HttpPostOptions, token?: vscode.CancellationToken): Promise<HttpResponse> {
        const cancelTokenSource = axios.CancelToken.source();
        const tokenListener = token ? token.onCancellationRequested(() => cancelTokenSource.cancel()) : undefined;

        const config = createConfig(options?.allowRedirects, cancelTokenSource.token);

        if (data !== undefined && options?.json) {
            config.headers = {
                'content-type': 'application/json'
            };
        }

        try {
            const response = await axios.post<unknown>(
                url,
                (data !== undefined && options?.json) ? JSON.stringify(data) : data,
                config);

            return { data: response.data, headers: <{[key: string]: string}>response.headers, status: response.status };
        } finally {
            if (tokenListener) {
                tokenListener.dispose();
            }
        }
    }
}