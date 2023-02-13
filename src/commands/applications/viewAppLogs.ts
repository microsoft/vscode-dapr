// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import { IActionContext } from '@microsoft/vscode-azext-utils';
import { getLocalizationPathForFile } from '../../util/localization';
import * as nls from 'vscode-nls';
import { DaprApplication } from "../../services/daprApplicationProvider";

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export async function viewAppLogs(application: DaprApplication): Promise<void> {
    await Promise.resolve();
}

const createViewAppLogsCommand = () => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => {
    if (node == undefined) {
        throw new Error(localize('commands.applications.viewAppLogs.noPaletteSupport', 'Viewing logs requires selecting an application in the Dapr view.'));
    }

    return viewAppLogs(node.application);
}

export default createViewAppLogsCommand;
