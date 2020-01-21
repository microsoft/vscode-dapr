import * as fse from 'fs-extra';
import * as path from 'path';
import scaffoldTemplate from './templateScaffolder';

export async function scaffoldRedisComponent(name: string, folderPath: string, fileName: string, redisHost?: string): Promise<void> {
    // TODO: Use "redis" host name when a non-default network is used (e.g. DAPR_NETWORK is set).
    const content = await scaffoldTemplate(name, { redisHost: redisHost ?? 'localhost' });

    await fse.writeFile(path.join(folderPath, fileName), content, 'utf8');
}

export function scaffoldPubSubComponent(folderPath: string, options?: { fileName?: string, redisHost?: string }): Promise<void> {
    return scaffoldRedisComponent('components/pub-sub.yaml', folderPath, options?.fileName ?? 'redis_messagebus.yaml', options?.redisHost);
}

export function scaffoldStateStoreComponent(folderPath: string, options?: { fileName?: string, redisHost?: string }): Promise<void> {
    return scaffoldRedisComponent('components/state-store.yaml', folderPath, options?.fileName ?? 'redis.yaml', options?.redisHost);
}
