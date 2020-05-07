// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as path from 'path';
import * as process from 'process';
import { TemplateScaffolder } from './templateScaffolder';
import { Scaffolder } from './scaffolder';

export async function scaffoldRedisComponent(scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder, name: string, folderPath: string, fileName: string, redisHost?: string): Promise<void> {
    // NOTE: If DAPR_NETWORK is set, Dapr is running within a multi-container context and Redis is a separate container,
    //       so use 'redis' rather than 'localhost'. 
    await scaffolder.scaffoldFile(
        path.join(folderPath, fileName),
        () => templateScaffolder.scaffoldTemplate(name, { redisHost: redisHost ?? process.env.DAPR_REDIS_HOST ?? (process.env.DAPR_NETWORK ? 'redis' : 'localhost') }),
        () => Promise.resolve({ 'type': 'skip' }));
}

export function scaffoldPubSubComponent(scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder, folderPath: string, options?: { fileName?: string; redisHost?: string }): Promise<void> {
    return scaffoldRedisComponent(scaffolder, templateScaffolder, 'components/pub-sub.yaml', folderPath, options?.fileName ?? 'messagebus.yaml', options?.redisHost);
}

export function scaffoldStateStoreComponent(scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder, folderPath: string, options?: { fileName?: string; redisHost?: string }): Promise<void> {
    return scaffoldRedisComponent(scaffolder, templateScaffolder, 'components/state-store.yaml', folderPath, options?.fileName ?? 'statestore.yaml', options?.redisHost);
}
