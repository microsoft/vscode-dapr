/* eslint-disable @typescript-eslint/no-unsafe-call */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IActionContext } from 'vscode-azureextensionui';
import DetailsTreeDataProvider from "../../views/details/detailsTreeDataProvider";
import DaprComponentMetadataNode from "../../views/applications/daprComponentMetadataNode";

export function setComponentDetails(context: IActionContext, detailsTreeDataProvider: DetailsTreeDataProvider, node: DaprComponentMetadataNode | undefined): unknown {
    return detailsTreeDataProvider.setComponentDetails(node?.daprComponentMetadata);
}

const createSetComponentDetailsCommand = (detailsTreeDataProvider: DetailsTreeDataProvider) => (context: IActionContext, node: DaprComponentMetadataNode | undefined): unknown => setComponentDetails(context, detailsTreeDataProvider, node);

export default createSetComponentDetailsCommand;