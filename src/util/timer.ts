import * as vscode from 'vscode';

export default class Timer {
    static Timeout(delay: number): Promise<void> {
        return new Promise(
            (resolve) => {
                setTimeout(resolve, delay);
            });
    }

    static Interval(delay: number, callback: () => void): vscode.Disposable {
        let timer: NodeJS.Timeout | undefined = setInterval(callback, delay);

        return new vscode.Disposable(
            () => {
                if (timer) {
                    clearInterval(timer);
                    timer = undefined;
                }
            });
    }
}