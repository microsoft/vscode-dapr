// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as nls from 'vscode-nls';
import * as vscode from 'vscode';
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { DaprRunNode } from "../../views/applications/daprRunNode";
import { getLocalizationPathForFile } from '../../util/localization';
import { DaprCliClient } from '../../services/daprCliClient';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

async function stopRun(context: IActionContext, label: string, runTemplatePath: string, daprCliClient: DaprCliClient): Promise<void> {
    const stopItem: vscode.MessageItem = { title: localize('commands.applications.stopRun.stopItemTitle', 'Stop Run') };
    
    const selectedItem = await context.ui.showWarningMessage(
        localize('commands.applications.stopRun.confirmationMessage', 'Stop the Dapr run \'{0}\'?', label),
        {
            detail: localize('commands.applications.stopRun.detailMessage', 'All applications associated with the run will be stopped.'),
            modal: true
        },
        stopItem);

    if (selectedItem === stopItem) {
        await daprCliClient.stopRun(runTemplatePath);
    }
}

const createStopRunCommand = (daprCliClient: DaprCliClient) => (context: IActionContext, node: DaprRunNode | undefined): Promise<void> => {
    if (node == undefined || node.runTemplatePath === undefined) {
        throw new Error(localize('commands.applications.stopRun.noPaletteSupport', 'Stopping requires selecting a valid run in the Dapr view.'));
    }

    return stopRun(context, node.label, node.runTemplatePath, daprCliClient);
}

export default createStopRunCommand;
