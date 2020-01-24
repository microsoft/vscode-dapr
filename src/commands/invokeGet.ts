import DaprApplicationNode from "../views/applications/daprApplicationNode";

export default function invokeGet(node: DaprApplicationNode | undefined): void {
    if (node) {
        console.log(node.application.appId);
    }
}