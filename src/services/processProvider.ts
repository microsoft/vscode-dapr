// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as psList from 'ps-list';
import * as os from 'os';
import { Process } from '../util/process';
import * as fs from 'fs'

export interface ProcessInfo {
    cmd: string;
    name: string;
    pid: number;
    ppid: number | undefined;
}

export interface ProcessProvider {
    listProcesses(name: string, daprdPath: string): Promise<ProcessInfo[]>;
}

export class UnixProcessProvider implements ProcessProvider {
    async listProcesses(name: string, daprdPath: string): Promise<ProcessInfo[]> {
        const processes = await psList();
        const temp = processes
            .filter(process => process.name === name || this.hasDaprdPath(process, daprdPath))
            .map(process => ({ name: process.name, cmd: process.cmd ?? '', pid: process.pid , ppid: this.getDaprPpid(process, daprdPath)}));
        return temp;
    }

    hasDaprdPath(process: psList.ProcessDescriptor, daprdPath: string): boolean | undefined {
        if (daprdPath !== 'daprd') { //check if config path provided
            return process.cmd?.startsWith(daprdPath.concat(" "))
        } else { //if no config path, check if filepath is executable
            const daprdEndPoint = '/daprd ';
            const endpoint = process.cmd?.indexOf(daprdEndPoint);
            if(endpoint !== undefined && endpoint !== -1) {
                const executable = process.cmd?.substring(0, endpoint + daprdEndPoint.length - 1)
                if(executable !== undefined) {
                    try {
                        fs.accessSync(executable, fs.constants.X_OK);
                        return true;
                    } catch(ex) {
                        return false;
                    }
                }
            }
        }
    }

    getDaprPpid(process: psList.ProcessDescriptor, daprdPath: string): number | undefined {
        if(this.hasDaprdPath(process, daprdPath)) {
            return process.ppid
        } 
        return undefined;
    }

}

interface WmiWin32ProcessObject {
    readonly CommandLine: string | null;
    readonly Name: string;
    readonly ParentProcessId: number;
    readonly ProcessId: number;
}

export class WindowsProcessProvider implements ProcessProvider {
    async listProcesses(name: string): Promise<ProcessInfo[]> {
        const list = await Process.exec(
            `Get-WmiObject -Query "select CommandLine, Name, ParentProcessId, ProcessId from win32_process where Name='${name}.exe'" | Select-Object -Property CommandLine, Name, ParentProcessId, ProcessId | ConvertTo-Json`,
            {
                shell: 'powershell.exe'
            });

        if (list.code === 0 && list.stdout.length) {
            let output: WmiWin32ProcessObject[];

            try {
                const json: unknown = JSON.parse(list.stdout);

                // NOTE: ConvertTo-Json returns a single JSON object when given a single object rather than a collection.
                //       The -AsArray argument isn't available until PowerShell 7.0 and later.

                if (Array.isArray(json)) {
                    output = <WmiWin32ProcessObject[]>json;
                } else {
                    output = [<WmiWin32ProcessObject>json];
                }
                
                return output.map(o => ({ cmd: o.CommandLine ?? '', name: o.Name, pid: o.ProcessId, ppid: o.ParentProcessId }));
            }
            catch {       
                // NOTE: No-op.                         
            }
        }

        return [];
    }
}

export default function createPlatformProcessProvider(): ProcessProvider {
    if (os.platform() === 'win32') {
        return new WindowsProcessProvider();
    } else {
        return new UnixProcessProvider();
    }
}