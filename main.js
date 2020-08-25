// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

const nls = require('vscode-nls');
const path = require('path');

const options = { 
    messageFormat: nls.MessageFormat.bundle
};

// TODO: Should we use VSCODE_NLS_CONFIG?
if (process.env.VSCODE_DAPR_LOCALE) {
    options.locale = process.env.VSCODE_DAPR_LOCALE;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const localize = nls.config(options)();

function activate(ctx) {
    const ignoreBundle = !/^(false|0)?$/i.test(process.env.VSCODE_DAPR_IGNORE_BUNDLE || '');
    const extensionFolderName = ignoreBundle ? "out" : "dist"
    const extensionPath = `./${extensionFolderName}/extension`;

    global.vscodeDapr = {
        localizationRootPath: path.join(ctx.extensionPath, extensionFolderName)
    };

    const extension = require(extensionPath);

    return extension.activate(ctx);
}

function deactivate(ctx) {
    return extension.deactivate(ctx);
}

exports.activate = activate;
exports.deactivate = deactivate;
