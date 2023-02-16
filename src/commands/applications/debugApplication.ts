// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as path from 'path';
import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { DaprApplication } from "../../services/daprApplicationProvider";
import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import psList, { ProcessDescriptor } from 'ps-list';
import { getLocalizationPathForFile } from '../../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

type AttachBehavior = () => Promise<void>;

async function attachToProcess(application: DaprApplication, type: string, pid: number): Promise<void> {
    const configuration: vscode.DebugConfiguration = {
        name: localize('commands.applications.debugApplication.sessionLabel', 'Dapr: {0} ({1})', application.appId, pid),
        request: 'attach',
        processId: pid.toString(),
        type
    };

    await vscode.debug.startDebugging(
        vscode.workspace.workspaceFolders?.[0],
        configuration);
}

function attachToDotnetProcess(application: DaprApplication, pid: number): Promise<void> {
    return attachToProcess(application, 'coreclr', pid);
}

function attachToNodeProcess(application: DaprApplication, pid: number): Promise<void> {
    return attachToProcess(application, 'node', pid);
}

async function attachToPythonProcess(application: DaprApplication, pid: number): Promise<void> {
    // NOTE: I've yet to see this succeed (the adaptor can't seem to attach to the process).
    return attachToProcess(application, 'python', pid);
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
                throw new Error(localize('commands.applications.debugApplication.tooManyDotnetProcesses', 'Unable to determine the child process of the .NET application to attach to.'));
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
    if (application.appPid === undefined) {
        throw new Error(localize('commands.applications.debugApplication.noAppProcess', 'No process is associated with the application \'{0}\'.', application.appId));
    }

    const processes = await psList();

    const applicationCommandProcess = processes.find(process => process.pid === application.appPid);

    if (applicationCommandProcess === undefined) {
        throw new Error(localize('commands.applications.debugApplication.processNotFound', 'The process associated with the application \'{0}\' is not running.', application.appId));
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
        throw new Error(localize('commands.applications.debugApplication.processNotRecognized', 'Unable to find an attachable process for the application \'{0}\'.', application.appId));
    }
    
    await attach();
}

const createDebugApplicationCommand = () => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => {
    if (node ===undefined) {
        throw new Error(localize('commands.applications.viewLogs.noPaletteSupport', 'Debugging requires selecting an application in the Dapr view.'));
    }

    return debugApplication(node.application);
}

export default createDebugApplicationCommand;
