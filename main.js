// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

const ignoreBundle = !/^(false|0)?$/i.test(process.env.VSCODE_DAPR_IGNORE_BUNDLE || '');
const extensionPath = ignoreBundle ? "./out/src/extension" : "./dist/extension";
const extension = require(extensionPath);

function activate(ctx) {
    return extension.activate(ctx);
}

function deactivate(ctx) {
    return extension.deactivate(ctx);
}

exports.activate = activate;
exports.deactivate = deactivate;
