import * as vscode from 'vscode';
import { DaprApplication } from './daprApplicationProvider';
import psList from 'ps-list';
import * as nls from 'vscode-nls';
import { getLocalizationPathForFile } from '../util/localization';
import { load } from 'js-yaml';
import { createClient } from 'redis';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

interface DaprComponentConfiguration {
    readonly apiVersion?: string;
    readonly kind?: string;
    readonly metadata?: {
        readonly name?: string;
    }
    readonly spec?: {
        readonly type?: string;
        readonly version?: string;
        readonly metadata?: {
            readonly name?: string;
            readonly value?: string;
        }[];
    }
}

async function getRedisKeys(applicationId: string, configuration: DaprComponentConfiguration): Promise<string[]> {
    const hostMetadata = configuration.spec?.metadata?.find(metadata => metadata.name === 'redisHost');

    if (!hostMetadata || !hostMetadata.value) {
        throw new Error('Redis host metadata not found.');
    }

    const host = hostMetadata.value;

    const passwordMetadata = configuration.spec?.metadata?.find(metadata => metadata.name === 'redisPassword');

    if (!passwordMetadata) {
        throw new Error('Redis password metadata not found.');
    }

    const password = passwordMetadata.value;

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

export function createDaprStateKeyProvider(applicationsProvider : () => Promise<DaprApplication[]>): DaprStateKeyProvider {
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

        const componentsPathRegex = /--components-path (?<componentsPath>([^" ]+)|"[^"]+")/g;

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

        switch (foundComponentConfig.spec?.type) {
            case 'state.redis':
                return await getRedisKeys(applicationId, foundComponentConfig);
            default:
                throw new Error(localize('services.daprStateKeyProvider.componentTypeNotSupported', 'The component type \'{0}\' is not supported.', foundComponentConfig.spec?.type));
        }

        return Promise.resolve([]);
    };
}
