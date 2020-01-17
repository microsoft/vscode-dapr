import * as fse from 'fs-extra';
import scaffoldTemplate from './templateScaffolder';

export async function scaffoldPubSubComponent(path: string, redisHost: string): Promise<void> {
    const content = await scaffoldTemplate('components/pub-sub.yaml', { redisHost });

    await fse.writeFile(path, content, 'utf8');
}

export async function scaffoldStateStoreComponent(path: string, redisHost: string): Promise<void> {
    const content = await scaffoldTemplate('components/state-store.yaml', { redisHost });

    await fse.writeFile(path, content, 'utf8');
}
