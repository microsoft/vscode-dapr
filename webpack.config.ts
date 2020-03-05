// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as path from 'path';
import * as TerserPlugin from 'terser-webpack-plugin';
import * as webpack from 'webpack';

export const config: webpack.Configuration = {
    target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

    entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: { // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: 'source-map',
    externals: {
        // Required by applicationinsights as a development dependency
        'applicationinsights-native-metrics': 'applicationinsights-native-metrics',
        // Has dynamic requires; ensure folder in node_modules is included in VSIX!
        'ms-rest': 'ms-rest',
        vscode: "commonjs vscode" // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    // https://github.com/webpack-contrib/terser-webpack-plugin/

                    // Don't mangle class names.  Otherwise parseError() will not recognize user cancelled errors (because their constructor name
                    // will match the mangled name, not UserCancelledError).  Also makes debugging easier in minified code.
                    keep_classnames: true,

                    // Don't mangle function names. https://github.com/microsoft/vscode-azurestorage/issues/525
                    keep_fnames: true
                }
            })
        ]
    },
    resolve: { // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        alias: {
            'handlebars' : 'handlebars/dist/handlebars.js'
        },
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader'
            }]
        }]
    },
}

export default config;
