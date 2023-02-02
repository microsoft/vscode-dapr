import { IActionContext } from "@microsoft/vscode-azext-utils";
import { DaprApplication } from "../../services/daprApplicationProvider";
import { DaprRunNode } from "../../views/applications/daprRunNode";
import { debugApplication } from "./debugApplication";

async function debugRun(applications: DaprApplication[]): Promise<void> {
    for (const application of applications.filter(a => a.appPid !== undefined)) {
        await debugApplication(application);
    }
}

const createDebugRunCommand = () => (context: IActionContext, node: DaprRunNode | undefined): Promise<void> => {
    if (node == undefined) {
        throw new Error('An application run must be selected.');
    }

    return debugRun(node.applications);
}

export default createDebugRunCommand;
