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

export default class ProcessBasedDaprApplicationProvider implements DaprApplicationProvider {
    private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();
    private readonly timer: vscode.Disposable;

    constructor() {
        // TODO: Do a sane comparison of the old vs. new applications.
        this.timer = Timer.Interval(2000, () => this.onDidChangeEmitter.fire());
    }

    get onDidChange(): vscode.Event<void> {
        return this.onDidChangeEmitter.event;
    }

    async getApplications(): Promise<DaprApplication[]> {
        const processes = await psList();
        const daprdProcesses = processes.filter(p => p.name === 'daprd');

        return daprdProcesses.map((process, index) => ({ appId: `app${index}`}));
    }
}
