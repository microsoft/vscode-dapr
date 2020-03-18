// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fse from 'fs-extra';
import * as handlebars from 'handlebars';
import * as path from 'path';

export interface TemplateScaffolder {
    scaffoldTemplate<T>(name: string, context: T): Promise<string>;
}

export default class HandlebarsTemplateScaffolder implements TemplateScaffolder {
    constructor(private readonly templatesPath: string) {
    }

    async scaffoldTemplate<T>(name: string, context: T): Promise<string> {
        const templatePath = path.join(this.templatesPath, name);

        const templateContent = await fse.readFile(templatePath, 'utf8');

        const template = handlebars.compile(templateContent);

        return template(context);
    }
}
