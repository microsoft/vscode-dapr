import * as path from 'path';

type daprGlobal = NodeJS.Global & typeof globalThis & {
    vscodeDapr?: {
        localizationPath: string;
    }
};

export function getPathForFile(fileName: string): string {
    const vscodeDapr = (<daprGlobal>global).vscodeDapr;

    if (vscodeDapr?.localizationPath) {
        let relativePath = fileName;

        if (relativePath.startsWith('src/')) {
            relativePath = fileName.substring(4);
        }
    
        return path.join(vscodeDapr.localizationPath, relativePath);
    }

    throw new Error('vscode-dapr globals not set.');
}

