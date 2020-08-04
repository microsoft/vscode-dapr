// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });


const nls = require('vscode-nls');

// TODO: Is the file message format what we want?
const options = { 
    messageFormat: nls.MessageFormat.file
};

// TODO: Should we use VSCODE_NLS_CONFIG?
if (process.env.VSCODE_DAPR_LOCALE) {
    options.locale = process.env.VSCODE_DAPR_LOCALE;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const localize = nls.config(options)();

const ignoreBundle = !/^(false|0)?$/i.test(process.env.VSCODE_DAPR_IGNORE_BUNDLE || '');
const extensionPath = ignoreBundle ? "./out/extension" : "./dist/extension";
const extension = require(extensionPath);

function activate(ctx) {
    return extension.activate(ctx);
}

function deactivate(ctx) {
    return extension.deactivate(ctx);
}

exports.activate = activate;
exports.deactivate = deactivate;
