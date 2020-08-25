// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as path from 'path';

type DaprGlobals = NodeJS.Global & typeof globalThis & {
    vscodeDapr?: {
        localizationRootPath: string;
    }
};

const sourceFolder = 'src';

/**
 * Returns a vscode-nls compatible path for locating the localization bundle for a source file.
 * 
 * vscode-nls expects a source path that represents two things: (1) a sub-folder from
 * which to work up to a folder that contains the bundle metadata and (2) given that
 * metadata folder, the relative path of the source file used as a key to locate the
 * messages (bundle) associated with that file.
 * 
 * webpack throws a wrench into localization when it packs the source into a single
 * source.  The __filename value ends up being the project-relative path of the source,
 * but there's no automatic mapping (of which I am aware) to meet both (1) and (2)
 * requirements *at module import time* (vs. at dynamic load time).
 * 
 * @param fileName The project-relative path to the original source file using localization.
 * @returns A vscode-nls compatible path representing both the bundle metadata and relative source locations.
 */
export function getLocalizationPathForFile(fileName: string): string {
    const vscodeDapr = (<DaprGlobals>global).vscodeDapr;

    if (vscodeDapr?.localizationRootPath) {
        const relativePath = path.relative(sourceFolder, fileName);

        return path.join(vscodeDapr.localizationRootPath, relativePath);
    }

    throw new Error('global.vscodeGapr.localizationRootPath must be set before importing extension modules.');
}
