import { default as tk } from "tree-kill";

export function treeKill(pid: number): Promise<void> {
    return new Promise(
        (resolve, reject) => {
            tk(
                pid,
                error => {
                    if (error) {
                        return reject(error);
                    }

                    return resolve();
                });
        });
}
