import * as psList from 'ps-list';
import * as vscode from 'vscode';
import Timer from '../util/timer';

export interface DaprApplication {
    appId: string;
}

export interface DaprApplicationProvider {
    readonly onDidChange: vscode.Event<void>;

    getApplications(): Promise<DaprApplication[]>;
}

function toApplication(cmd: string | undefined): DaprApplication | undefined {
    if (cmd) {
        const appIdRegEx = /--dapr-id (?<appId>[a-zA-Z0-9_-]+)/g;
        
        const appIdMatch = appIdRegEx.exec(cmd);
        
        const appId = appIdMatch?.groups?.['appId'];

        if (appId) {
            return {
                appId
            };
        }
    }

    return undefined;
}

export default class ProcessBasedDaprApplicationProvider extends vscode.Disposable implements DaprApplicationProvider {
    private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();
    private readonly timer: vscode.Disposable;

    constructor() {
        super(() => {
            this.timer.dispose();
            this.onDidChangeEmitter.dispose();
        });

        // TODO: Do a sane comparison of the old vs. new applications.
        this.timer = Timer.Interval(2000, () => this.onDidChangeEmitter.fire());
    }

    get onDidChange(): vscode.Event<void> {
        return this.onDidChangeEmitter.event;
    }

    async getApplications(): Promise<DaprApplication[]> {
        const processes = await psList();
        const daprdProcesses = processes.filter(p => p.name === 'daprd');

        return daprdProcesses
            .map(process => toApplication(process.cmd))
            .filter((application): application is DaprApplication => application !== undefined);
    }
}
