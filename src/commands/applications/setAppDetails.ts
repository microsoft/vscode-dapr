// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import { IActionContext } from 'vscode-azureextensionui';
import DetailsTreeDataProvider from "../../views/details/detailsTreeDataProvider";

export function setAppDetails(context: IActionContext, detailsTreeDataProvider: DetailsTreeDataProvider, node: DaprApplicationNode | undefined): void {
    return detailsTreeDataProvider.setAppDetails(node?.application);
}

const createSetAppDetailsCommand = (detailsTreeDataProvider: DetailsTreeDataProvider) => (context: IActionContext, node: DaprApplicationNode | undefined): unknown => setAppDetails(context, detailsTreeDataProvider, node);

export default createSetAppDetailsCommand;
