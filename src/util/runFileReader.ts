// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fs from 'fs/promises';
import * as nls from 'vscode-nls';
import * as path from 'path';
import { getLocalizationPathForFile } from '../util/localization';
import { load } from "js-yaml";

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

export interface DaprRunApplication {
    appDirPath?: string;
    appID?: string;
}

export interface DaprRunFile {
    apps?: DaprRunApplication[];
}

export async function fromRunFilePath(path: string): Promise<DaprRunFile>{
    const runFileContent = await fs.readFile(path, { encoding: 'utf8' });

    if (!runFileContent) {
        throw new Error(localize('util.runFileReader.noContent', 'There is no run file content at path: {0}', path));
    }

    return fromRunFileContent(runFileContent);
}

export function fromRunFileContent(content: string): DaprRunFile {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const runFile = load(content) as DaprRunFile;

    return runFile;
}

export function getAppId(app: DaprRunApplication): string {
    if (app.appID) {
        return app.appID;
    }

    if (app.appDirPath) {
        return path.basename(app.appDirPath);
    }

    throw new Error(localize('util.runFileReader.unableToDetermineAppId', 'Unable to determine a configured application\'s ID.'));
}
