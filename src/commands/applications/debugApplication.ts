import { IActionContext } from "@microsoft/vscode-azext-utils";
import { DaprApplication } from "../../services/daprApplicationProvider";
import DaprApplicationNode from "../../views/applications/daprApplicationNode";

function debugApplication(application: DaprApplication): Promise<void> {
    return Promise.resolve();
}

const createDebugApplicationCommand = () => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => {
    if (node == undefined) {
        throw new Error('An application must be selected.');
    }

    return debugApplication(node.application);
}

export default createDebugApplicationCommand;
