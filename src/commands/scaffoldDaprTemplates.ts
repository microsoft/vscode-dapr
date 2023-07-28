// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// import * as fs from 'fs/promises';
import * as path from 'path';
import * as fs from "fs-extra";
import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { getLocalizationPathForFile } from '../util/localization';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { UserInput, WizardStep } from '../services/userInput';
import { template } from 'handlebars';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

interface Template {
    name: string;
    label: string;
    url: string;
}

const distributedCalculatorTemplate: Template = {
    name: 'Distributed Calculator',
    label: 'distributed-calculator',
    url: 'https://github.com/IvanJobs/vscode-dapr/releases/download/template-0.0.0/distributed-calculator.zip'
};

const templates: Template[] = [distributedCalculatorTemplate];


async function scaffoldDaprTemplates(ui: UserInput): Promise<void> {
    const rootWorkspaceFolderPath = (vscode.workspace.workspaceFolders ?? [])[0]?.uri?.fsPath;

    if (!rootWorkspaceFolderPath) {
        throw new Error(localize('commands.scaffoldDaprTasks.noWorkspaceError', 'To scaffold Dapr templates, first open a folder or workspace.'));
    }
    const templateStep: WizardStep<any> =
        async wizardContext => {
            const templateItems = templates.map(template => ({ label: template.name, template }));
            const templateItem = await ui.showQuickPick(templateItems, { placeHolder: localize('commands.scaffoldDaprTasks.configurationPlaceholder', 'Select the template') });
            return {
                ...wizardContext,
                template: templateItem.template,
            };
        };

    const result = await ui.showWizard({ title: localize('commands.scaffoldDaprTasks.wizardTitle', 'Scaffold Dapr Tasks') }, templateStep);

    const templateDir = await chooseDirectory();
    if (!templateDir) {
        return;
    }
    const templatePath = path.join(templateDir.fsPath, result.template.label);
    await fs.mkdir(templatePath, { recursive: true });
    const zip = await downloadZip(result.template.url);
    await unzip(zip, templatePath);
    await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(templatePath), true);

}

async function chooseDirectory(): Promise<vscode.Uri | undefined> {
    const options: vscode.OpenDialogOptions = {
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select'
    };
    const result = await vscode.window.showOpenDialog(options);
    return result ? result[0] : undefined;
}

async function downloadZip(url: string): Promise<AdmZip> {
    const zip = await axios.get(url, { responseType: "arraybuffer" });
    return new AdmZip(zip.data);

}

async function unzip(
    zip: AdmZip,
    dstPath: string,
): Promise<void> {
    let entries: AdmZip.IZipEntry[] = zip.getEntries().filter((entry) => !entry.isDirectory);
    for (const entry of entries) {
        let entryName = entry.entryName;
        const filePath: string = path.join(dstPath, entryName);
        const dirPath: string = path.dirname(filePath);
        const rawEntryData: Buffer = entry.getData();
        await fs.ensureDir(dirPath);
        await fs.writeFile(filePath, rawEntryData);
    }
}

const createScaffoldDaprTemplatesCommand = (ui: UserInput) => (): Promise<void> => scaffoldDaprTemplates(ui);

export default createScaffoldDaprTemplatesCommand;
