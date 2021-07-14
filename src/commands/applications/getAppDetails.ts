// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import { IActionContext } from 'vscode-azureextensionui';
import AppDetailsTreeDataProvider from "../../views/details/appDetailsTreeDataProvider";

export function getAppDetails(context: IActionContext, detailsTreeDataProvider: AppDetailsTreeDataProvider, node: DaprApplicationNode | undefined): void {
    return detailsTreeDataProvider.getAppDetails(node?.application);
}

const createGetAppDetailsCommand = (detailsTreeDataProvider: AppDetailsTreeDataProvider) => (context: IActionContext, node: DaprApplicationNode | undefined): unknown => getAppDetails(context, detailsTreeDataProvider, node);

export default createGetAppDetailsCommand;