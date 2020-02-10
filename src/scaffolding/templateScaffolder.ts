// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fse from 'fs-extra';
import * as handlebars from 'handlebars';
import * as path from 'path';

let templatesPath: string;

export function initializeTemplateScaffolder(extensionPath: string): void {
    templatesPath = path.join(extensionPath, 'assets', 'templates');
}

export default async function scaffoldTemplate<T>(name: string, context: T): Promise<string> {
    const templatePath = path.join(templatesPath, name);

    const templateContent = await fse.readFile(templatePath, 'utf8');

    const template = handlebars.compile(templateContent);

    return template(context);
}
