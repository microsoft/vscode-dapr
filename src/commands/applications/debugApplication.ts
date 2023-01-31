import * as path from 'path';
import * as vscode from 'vscode';
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { DaprApplication } from "../../services/daprApplicationProvider";
import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import psList, { ProcessDescriptor } from 'ps-list';

type AttachBehavior = () => Promise<void>;

async function attachToNodeProcess(pid: number): Promise<void> {
    const configuration: vscode.DebugConfiguration = {
        name: `Node Process ${pid}`,
        request: 'attach',
        processId: pid.toString(),
        type: 'node'
    };

    await vscode.debug.startDebugging(
        vscode.workspace.workspaceFolders?.[0],
        configuration);
}

function getAttachBehavior(process: ProcessDescriptor): AttachBehavior | undefined {
    const executable = path.basename(process.name);

    switch (executable) {
        case 'node':
            return () => attachToNodeProcess(process.pid);

        default:
            return undefined;
    }
}

async function debugApplication(application: DaprApplication): Promise<void> {
    var processes = await psList();

    const children = processes.filter(process => process.ppid === application.ppid);

    let childProcess: ProcessDescriptor | undefined;
    let attach: AttachBehavior | undefined = undefined;

    while (childProcess = children.pop()) {
        attach = getAttachBehavior(childProcess);

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
