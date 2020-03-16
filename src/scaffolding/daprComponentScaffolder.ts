// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fse from 'fs-extra';
import * as path from 'path';
import * as process from 'process';
import { TemplateScaffolder } from './templateScaffolder';

export async function scaffoldRedisComponent(templateScaffolder: TemplateScaffolder, name: string, folderPath: string, fileName: string, redisHost?: string): Promise<void> {
    // NOTE: If DAPR_NETWORK is set, Dapr is running within a multi-container context and Redis is a separate container,
    //       so use 'redis' rather than 'localhost'. 
    const content = await templateScaffolder.scaffoldTemplate(name, { redisHost: redisHost ?? (process.env.DAPR_NETWORK ? 'redis' : 'localhost') });

    await fse.writeFile(path.join(folderPath, fileName), content, 'utf8');
}

export function scaffoldPubSubComponent(templateScaffolder: TemplateScaffolder, folderPath: string, options?: { fileName?: string; redisHost?: string }): Promise<void> {
    return scaffoldRedisComponent(templateScaffolder, 'components/pub-sub.yaml', folderPath, options?.fileName ?? 'messagebus.yaml', options?.redisHost);
}

export function scaffoldStateStoreComponent(templateScaffolder: TemplateScaffolder, folderPath: string, options?: { fileName?: string; redisHost?: string }): Promise<void> {
    return scaffoldRedisComponent(templateScaffolder, 'components/state-store.yaml', folderPath, options?.fileName ?? 'statestore.yaml', options?.redisHost);
}
