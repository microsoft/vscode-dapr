// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as nls from 'vscode-nls';
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { DaprApplication } from "../../services/daprApplicationProvider";
import { DaprRunNode } from "../../views/applications/daprRunNode";
import { debugApplication } from "./debugApplication";
import { getLocalizationPathForFile } from '../../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

async function debugRun(applications: DaprApplication[]): Promise<void> {
    for (const application of applications.filter(a => a.appPid !== undefined)) {
        await debugApplication(application);
    }
}

const createDebugRunCommand = () => (context: IActionContext, node: DaprRunNode | undefined): Promise<void> => {
    if (node === undefined) {
        throw new Error(localize('commands.applications.debugRun.noPaletteSupport', 'Debugging requires selecting a run in the Dapr view.'));
    }

    return debugRun(node.applications);
}

export default createDebugRunCommand;
