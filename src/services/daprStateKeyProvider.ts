import * as vscode from 'vscode';
import { DaprApplication } from './daprApplicationProvider';
import psList from 'ps-list';
import * as nls from 'vscode-nls';
import { getLocalizationPathForFile } from '../util/localization';
import { load } from 'js-yaml';
import { createClient } from 'redis';
import { DaprClientApplication } from './daprClient';
import { DaprClient } from '@dapr/dapr';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

interface DaprComponentMetadata {
    readonly name?: string;
    readonly secretKeyRef?: {
        readonly name?: string;
        readonly key?: string;
    }
    readonly value?: string;
}

interface DaprComponentConfiguration {
    readonly apiVersion?: string;
    readonly kind?: string;
    readonly metadata?: {
        readonly name?: string;
    }
    readonly spec?: {
        readonly type?: string;
        readonly version?: string;
        readonly metadata?: DaprComponentMetadata[];
    }
    readonly auth?: {
        readonly secretStore?: string;
    }
}

type DaprSecretProvider = (store: string, name: string, key: string) => Promise<string | undefined>;

function resolveDaprComponentMetadata(
    metadata: DaprComponentMetadata | undefined,
    secretStore: string | undefined,
    secretProvider: DaprSecretProvider): Promise<string | undefined> {
    if (!metadata) {
        return Promise.resolve(undefined);
    }

    if (metadata.value !== undefined) {
        return Promise.resolve(metadata.value);
    }

    if (secretStore && metadata.secretKeyRef?.key && metadata.secretKeyRef?.name) {
        return secretProvider(secretStore, metadata.secretKeyRef.name, metadata.secretKeyRef.key);
    }

    return Promise.resolve(undefined);
}

async function getRedisKeys(applicationId: string, configuration: DaprComponentConfiguration, secretProvider: DaprSecretProvider): Promise<string[]> {
    const host = await resolveDaprComponentMetadata(
        configuration.spec?.metadata?.find(metadata => metadata.name === 'redisHost'),
        configuration.auth?.secretStore,
        secretProvider);

    if (host === undefined) {
        throw new Error('Unable to find or resolve Redis host metadata.');
    }

    const password = await resolveDaprComponentMetadata(
        configuration.spec?.metadata?.find(metadata => metadata.name === 'redisPassword'),
        configuration.auth?.secretStore,
        secretProvider);

    const client = createClient({
        url: `redis://${host}`,
        password: password
    });

    await client.connect();

    try {
        const keys = [];
        for await (const key of client.scanIterator(
            {
                MATCH: `${applicationId}||*`,
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
}

export type DaprStateKeyProvider = (applicationId: string, componentName: string) => Promise<string[]>;

export function createDaprStateKeyProvider(
    applicationsProvider : () => Promise<DaprApplication[]>,
    clientProvider: (application: DaprClientApplication) => DaprClient): DaprStateKeyProvider {
    return async (applicationId: string, componentName: string) => {
        const applications = await applicationsProvider();
        const application = applications.find(application => application.appId === applicationId);

        if (!application) {
            throw new Error(`Application '${applicationId}' not found.`);
        }

        const processes = await psList();

        const applicationCommandProcess = processes.find(process => process.pid === application.pid);
    
        if (applicationCommandProcess === undefined) {
            throw new Error(localize('services.daprStateKeyProvider.processNotFound', 'The process associated with the application \'{0}\' is not running.', application.appId));
        }

        const componentsPathRegex = /--(components-path|resources-path) (?<componentsPath>([^" ]+)|"[^"]+")/g;

        // TODO: Support Windows (as cmd property isn't supported).
        const componentsPathMatch = componentsPathRegex.exec(applicationCommandProcess.cmd ?? '');

        const componentsPath = componentsPathMatch?.groups?.componentsPath ?? '~/.dapr/components';

        const componentsPathUri = vscode.Uri.file(componentsPath);

        const componentFiles = await vscode.workspace.fs.readDirectory(componentsPathUri);

        let foundComponentConfig: DaprComponentConfiguration | undefined;

        for (const [componentFile, componentFileType] of componentFiles) {
            if (componentFileType !== vscode.FileType.File) {
                continue;
            }

            const componentFileUri = componentsPathUri.with({ path: `${componentsPathUri.path}/${componentFile}` });

            const content = await vscode.workspace.fs.readFile(componentFileUri);

            const componentConfig = load(content.toString()) as DaprComponentConfiguration;

            if (componentConfig.metadata?.name === componentName) {
                foundComponentConfig = componentConfig;
                break;
            }
        }

        if (foundComponentConfig === undefined) {
            throw new Error(localize('services.daprStateKeyProvider.componentNotFound', 'The component \'{0}\' was not found.', componentName));
        }

        async function getSecret(store: string, name: string, key: string): Promise<string | undefined> {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const daprClient = clientProvider(application!);

            const secret = await daprClient.secret.get(store, name) as { [key: string]: string };

            return secret[key];
        }

        switch (foundComponentConfig.spec?.type) {
            case 'state.redis':
                return await getRedisKeys(applicationId, foundComponentConfig, getSecret);
            default:
                throw new Error(localize('services.daprStateKeyProvider.componentTypeNotSupported', 'The component type \'{0}\' is not supported.', foundComponentConfig.spec?.type));
        }

        return Promise.resolve([]);
    };
}
