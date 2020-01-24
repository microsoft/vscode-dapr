import axios from 'axios';
import * as vscode from 'vscode';

export interface HttpResponse {
    data: unknown;
}

export interface HttpClient {
    get(url: string, token?: vscode.CancellationToken): Promise<HttpResponse>;
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
}