import * as path from 'path';
import * as vscode from 'vscode';
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { DaprApplication } from "../../services/daprApplicationProvider";
import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import psList, { ProcessDescriptor } from 'ps-list';

type AttachBehavior = () => Promise<void>;

async function attachToDotnetProcess(application: DaprApplication, pid: number): Promise<void> {
    const configuration: vscode.DebugConfiguration = {
        name: `Dapr: ${application.appId} (${pid})`,
        request: 'attach',
        processId: pid.toString(),
        type: 'coreclr'
    };

    await vscode.debug.startDebugging(
        vscode.workspace.workspaceFolders?.[0],
        configuration);
}

async function attachToNodeProcess(application: DaprApplication, pid: number): Promise<void> {
    const configuration: vscode.DebugConfiguration = {
        name: `Dapr: ${application.appId} (${pid})`,
        request: 'attach',
        processId: pid.toString(),
        type: 'node'
    };

    await vscode.debug.startDebugging(
        vscode.workspace.workspaceFolders?.[0],
        configuration);
}

async function attachToPythonProcess(application: DaprApplication, pid: number): Promise<void> {
    const configuration: vscode.DebugConfiguration = {
        name: `Dapr: ${application.appId} (${pid})`,
        request: 'attach',
        processId: pid.toString(),
        type: 'python'
    };

    await vscode.debug.startDebugging(
        vscode.workspace.workspaceFolders?.[0],
        configuration);
}

function getAttachBehavior(application: DaprApplication, process: ProcessDescriptor, processes: ProcessDescriptor[]): AttachBehavior | undefined {
    const executable = path.basename(process.name);

    switch (executable.toLowerCase()) {
        case 'dotnet': {
            //
            // NOTE: The `dotnet` process is just the runner for the .NET application;
            //       we need to look for (a single) child process.
            //

            const childProcesses = processes.filter(p => p.ppid === process.pid);

            if (childProcesses.length !== 1) {
                throw new Error('Unable to determine the child process of the .NET application to attach to.');
            }

            return () => attachToDotnetProcess(application, childProcesses[0].pid);
        }
        case 'node':
            return () => attachToNodeProcess(application, process.pid);

        case 'python':
        case 'python2':
        case 'python3':
            return () => attachToPythonProcess(application, process.pid);

        default:
            return undefined;
    }
}

export async function debugApplication(application: DaprApplication): Promise<void> {
    // If using a version of Dapr that doesn't include the app PID, or the app PID is zero (meaning there was no app started),
    // we won't be able to (definitively) determine the app process...
    if (application.appPid === undefined) {
        throw new Error('Unable to determine the application command process.');
    }

    const processes = await psList();

    const applicationCommandProcess = processes.find(process => process.pid === application.appPid);

    if (applicationCommandProcess === undefined) {
        throw new Error('The application process is not running.');
    }

    const children = [ applicationCommandProcess ];

    let childProcess: ProcessDescriptor | undefined;
    let attach: AttachBehavior | undefined = undefined;

    while ((childProcess = children.pop())) {
        attach = getAttachBehavior(application, childProcess, processes);

        if (attach) {
            break;
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        children.push(...processes.filter(process => process.ppid === childProcess!.pid));
    }

    if (attach === undefined) {
        throw new Error('Unable to find an attachable process in the Dapr process tree.');
    }
    
    await attach();
}

const createDebugApplicationCommand = () => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => {
    if (node == undefined) {
        throw new Error('An application must be selected.');
    }

    return debugApplication(node.application);
}

export default createDebugApplicationCommand;
