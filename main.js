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

var actualExtension;

function getExtension(extensionPath) {
    if (!actualExtension) {
        const extensionFolderName = 'dist';
        const extensionFileName = `./${extensionFolderName}/extension`;
    
        global.vscodeDapr = {
            localizationRootPath: path.join(extensionPath, extensionFolderName)
        };
    
        actualExtension = require(extensionFileName);
    }

    return actualExtension;
}

function activate(ctx) {
    getExtension(ctx.extensionPath).activate(ctx);
}

function deactivate(ctx) {
    getExtension(ctx.extensionPath).deactivate(ctx);
}

exports.activate = activate;
exports.deactivate = deactivate;
