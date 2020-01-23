import * as vscode from 'vscode';

export default class Timer {
    static Timeout(delay: number): Promise<void> {
        return new Promise(
            (resolve) => {
                setTimeout(resolve, delay);
            });
    }

    static Interval(delay: number, callback: () => void): vscode.Disposable {
        const timer = setInterval(callback, delay);

        return new vscode.Disposable(
            () => {
                clearInterval(timer);
            });
    }
}