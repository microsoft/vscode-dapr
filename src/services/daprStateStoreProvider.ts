import { createClient } from "redis";

export interface DaprStateStore {
    getKeys(appId: string): Promise<string[]>;
    getValue(appId: string, key: string): Promise<string | undefined>;
}

export interface DaprStateStoreProvider {
    getStateStore(name: string): Promise<DaprStateStore>;
}

export class RedisDaprStateStoreProvider implements DaprStateStoreProvider {
    getStateStore(): Promise<DaprStateStore> {
        return Promise.resolve({
            getKeys: async (appId: string) => {
                const client = createClient({
                    url: 'redis://localhost:6379'
                });

                await client.connect();

                try {
                    const keys = [];
                    for await (const key of client.scanIterator(
                        {
                            MATCH: `${appId}||*`,
                        }
                    )) {
                        const splitKeys = key.split('||');

                        if (splitKeys.length === 2) {
                            keys.push(splitKeys[1]);
                        }
                    }
                    return keys;
                } finally {
                    await client.disconnect();
                }
            },
            getValue: async (appId: string, key: string) => {
                const client = createClient({
                    url: 'redis://localhost:6379'
                });

                await client.connect();

                try {
                    const value = await client.hGet(`${appId}||${key}`, "data");

                    return value;
                } finally {
                    await client.disconnect();
                }
            }
        });
    }
}
