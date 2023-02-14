// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as nls from 'vscode-nls';
import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import { IActionContext } from '@microsoft/vscode-azext-utils';
import { getLocalizationPathForFile } from '../../util/localization';
import { viewLogs } from './viewLogs';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

const createViewAppLogsCommand = () => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => {
    if (node == undefined) {
        throw new Error(localize('commands.applications.viewAppLogs.noPaletteSupport', 'Viewing application logs requires selecting an application in the Dapr view.'));
    }

    return viewLogs(node.application, 'app');
}

export default createViewAppLogsCommand;
