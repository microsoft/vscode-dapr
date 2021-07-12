// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import DaprApplicationNode from "../../views/applications/daprApplicationNode";
import { UserInput } from '../../services/userInput';
import { DaprClient } from '../../services/daprClient';
import { IActionContext } from 'vscode-azureextensionui';
import { getLocalizationPathForFile } from '../../util/localization';
import * as nls from 'vscode-nls';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export async function stopApp(daprClient: DaprClient, ui: UserInput, node: DaprApplicationNode | undefined): Promise<void> {  
    try { 
        return daprClient.stopApp(node?.application); 
    } catch {
        await ui.showWarningMessage(localize('commands.invokeCommon.stopAppError', 'Failed to stop application \'{0}\'', node?.application.appId),
        { modal: true });
    }
}

const createStopCommand = (daprClient: DaprClient, ui: UserInput) => (context: IActionContext, node: DaprApplicationNode | undefined): Promise<void> => stopApp(daprClient, ui, node);

export default createStopCommand;