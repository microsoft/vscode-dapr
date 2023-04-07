import * as vscode from 'vscode';

export default class DaprStateStoreDocumentContentProvider extends vscode.Disposable implements vscode.TextDocumentContentProvider {
    private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();

    constructor(
        private readonly stateValueProvider: (applicationId: string, componentsName: string, key: string, token: vscode.CancellationToken) => vscode.ProviderResult<string>,
    ) {
        super(() => {
            this.onDidChangeEmitter.dispose();
        });
    }

    onDidChange = this.onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        // Dapr URI Schemas:
        //
        // Store State:    dapr://state/<applicationId>/<componentsName>/keys/key
        // Actor State:    dapr://state/<applicationId>/<componentsName>/actors/actorType/actorId/key
        // Workflow State: dapr://state/<applicationId>/<componentsName>/workflows/workflowId/key

        if (uri.authority !== 'state') {
            throw new Error('Unrecognized Dapr URI authority.');
        }

        const splitPath = uri.path.split('/');

        if (splitPath.length !== 5) {
            throw new Error('Unrecognized Dapr URI path.');
        }

        const applicationId = splitPath[1];
        const componentsName = splitPath[2];
        const type = splitPath[3];
        const key = splitPath[4];

        if (type !== 'keys') {
            throw new Error('Unrecognized Dapr URI path.');
        }

        return this.stateValueProvider(applicationId, componentsName, key, token);
    }
}
