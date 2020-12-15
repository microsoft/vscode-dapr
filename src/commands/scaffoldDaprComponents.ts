// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fse from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { scaffoldStateStoreComponent, scaffoldPubSubComponent, scaffoldZipkinComponent } from "../scaffolding/daprComponentScaffolder";
import { TemplateScaffolder } from '../scaffolding/templateScaffolder';
import { Scaffolder } from '../scaffolding/scaffolder';
import { getLocalizationPathForFile } from '../util/localization';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

async function scaffoldDaprComponents(scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder): Promise<void> {
    // TODO: Verify open workspace/folder.
    const rootWorkspaceFolderPath = (vscode.workspace.workspaceFolders ?? [])[0]?.uri?.fsPath;

    if (!rootWorkspaceFolderPath) {
        throw new Error(localize('commands.scaffoldDaprTasks.noWorkspaceError', 'Open a folder or workspace.'));
    }

    const componentsPath = path.join(rootWorkspaceFolderPath, 'components');

    await fse.ensureDir(componentsPath);

    const components = await fse.readdir(componentsPath);

    // Only scaffold the components if none exist...
    if (components.length === 0) {
        await scaffoldStateStoreComponent(scaffolder, templateScaffolder, componentsPath);
        await scaffoldPubSubComponent(scaffolder, templateScaffolder, componentsPath);
        await scaffoldZipkinComponent(scaffolder, templateScaffolder, componentsPath);
    }
}

const createScaffoldDaprComponentsCommand = (scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder) => (): Promise<void> => scaffoldDaprComponents(scaffolder, templateScaffolder);

export default createScaffoldDaprComponentsCommand;
