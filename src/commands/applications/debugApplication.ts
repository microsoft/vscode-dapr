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

function getAttachBehavior(application: DaprApplication, process: ProcessDescriptor, processes: ProcessDescriptor[]): AttachBehavior | undefined {
    const executable = path.basename(process.name);

    switch (executable) {
        case 'dotnet':
            //
            // NOTE: The `dotnet` process is just the runner for the .NET application;
            //       we need to look for (a single) child process.
            //

            const childProcesses = processes.filter(p => p.ppid === process.pid);

            if (childProcesses.length !== 1) {
                throw new Error('Unable to determine the child process of the .NET application to attach to.');
            }

            return () => attachToDotnetProcess(application, childProcesses[0].pid);

        case 'node':
            return () => attachToNodeProcess(application, process.pid);

        default:
            return undefined;
    }
}

function findApplicationCommandProcess(application: DaprApplication, processes: ProcessDescriptor[]): ProcessDescriptor | undefined {
    // NOTE: Until we get https://github.com/dapr/cli/issues/1191, we can't directly determine which of the child processes
    //       created by `dapr` correspond to a given application. For the time being, we correlate the name of the process
    //       to the start of the command for the application.
    //
    //       It's important to note that this only works if each application has an entirely different commands.
    return processes.find(process => application.command.startsWith(process.name));
}

async function debugApplication(application: DaprApplication): Promise<void> {
    var processes = await psList();

    const daprChildren = processes.filter(process => process.ppid === application.ppid);

    const applicationCommandProcess = findApplicationCommandProcess(application, daprChildren);

    if (applicationCommandProcess === undefined) {
        throw new Error('Unable to determine the application command process.');
    }

    const children = [ applicationCommandProcess ];

    let childProcess: ProcessDescriptor | undefined;
    let attach: AttachBehavior | undefined = undefined;

    while (childProcess = children.pop()) {
        attach = getAttachBehavior(application, childProcess, processes);

        if (attach) {
            break;
        }

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
