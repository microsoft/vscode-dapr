// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as path from 'path';
import * as process from 'process';
import { TemplateScaffolder } from './templateScaffolder';
import { Scaffolder } from './scaffolder';
import { ConflictHandler } from './conflicts';

export async function scaffoldRedisComponent(scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder, name: string, folderPath: string, fileName: string, onConflict: ConflictHandler, redisHost?: string): Promise<void> {
    // NOTE: If DAPR_NETWORK is set, Dapr is running within a multi-container context and Redis is a separate container,
    //       so use 'dapr_redis' rather than 'localhost'. 
    await scaffolder.scaffoldFile(
        path.join(folderPath, fileName),
        () => templateScaffolder.scaffoldTemplate(name, { redisHost: redisHost ?? process.env.DAPR_REDIS_HOST ?? (process.env.DAPR_NETWORK ? 'dapr_redis' : 'localhost') }),
        onConflict);
}

export function scaffoldPubSubComponent(scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder, folderPath: string, onConflict: ConflictHandler, options?: { fileName?: string; redisHost?: string }): Promise<void> {
    return scaffoldRedisComponent(scaffolder, templateScaffolder, 'components/pub-sub.yaml', folderPath, options?.fileName ?? 'pubsub.yaml', onConflict, options?.redisHost);
}

export function scaffoldStateStoreComponent(scaffolder: Scaffolder, templateScaffolder: TemplateScaffolder, folderPath: string, onConflict: ConflictHandler, options?: { fileName?: string; redisHost?: string }): Promise<void> {
    return scaffoldRedisComponent(scaffolder, templateScaffolder, 'components/state-store.yaml', folderPath, options?.fileName ?? 'statestore.yaml', onConflict, options?.redisHost);
}
