// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as nls from 'vscode-nls';

// TODO: Is the file message format what we want?
const options: nls.Options = { 
    messageFormat: nls.MessageFormat.file
};

// TODO: Should we use VSCODE_NLS_CONFIG?
if (process.env.VSCODE_DAPR_LOCALE) {
    options.locale = process.env.VSCODE_DAPR_LOCALE;
}

export const localize = nls.config(options)();
