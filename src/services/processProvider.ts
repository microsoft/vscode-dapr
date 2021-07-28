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


function getWmicValue(line: string): string {
    const index = line.indexOf('=');

    return line.substring(index + 1);
}

export class WindowsProcessProvider implements ProcessProvider {
    async listProcesses(name: string): Promise<ProcessInfo[]> {
        const list = await Process.exec(`wmic process where "name='${name}.exe'" get commandline,name,parentprocessid,processid /format:list`);
        
        // Lines in the output are delimited by "<CR><CR><LF>".
        const lines = list.stdout.split('\r\r\n');

        const processes: ProcessInfo[] = [];

        // Each item in the list is prefixed by two empty lines, then <property>=<value> lines, in alphabetical order.
        for (let i = 0; i < lines.length / 5; i++) {
            // Stop if the input is truncated (as there is an upper output limit)...
            if ((i * 5) + 4 >= lines.length) {
                break;
            }

            const cmd = getWmicValue(lines[(i * 5) + 2]);
            const name = getWmicValue(lines[(i * 5) + 3]);
            const ppid = parseInt(getWmicValue(lines[(i*5) + 4]), 10); 
            const pid = parseInt(getWmicValue(lines[(i * 5) + 5]), 10);
            

            processes.push({ cmd, name, pid, ppid});
        }

        return processes;
    }
}

export default function createPlatformProcessProvider(): ProcessProvider {
    if (os.platform() === 'win32') {
        return new WindowsProcessProvider();
    } else {
        return new UnixProcessProvider();
    }
}