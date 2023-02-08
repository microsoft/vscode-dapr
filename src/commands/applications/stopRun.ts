// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as nls from 'vscode-nls';
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { DaprRunNode } from "../../views/applications/daprRunNode";
import { getLocalizationPathForFile } from '../../util/localization';
import { DaprCliClient } from '../../services/daprCliClient';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

async function stopRun(context: IActionContext, label: string, runTemplatePath: string, daprCliClient: DaprCliClient): Promise<void> {
    await Promise.resolve();
}

const createStopRunCommand = (daprCliClient: DaprCliClient) => (context: IActionContext, node: DaprRunNode | undefined): Promise<void> => {
    if (node == undefined || node.runTemplatePath === undefined) {
        throw new Error(localize('commands.applications.stopRun.noPaletteSupport', 'Stopping requires selecting a valid run in the Dapr view.'));
    }

    return stopRun(context, node.label, node.runTemplatePath, daprCliClient);
}

export default createStopRunCommand;
