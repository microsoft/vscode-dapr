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
    plugins: [
        // Fix error:
        //   > WARNING in ./node_modules/ms-rest/lib/serviceClient.js 441:19-43
        //   > Critical dependency: the request of a dependency is an expression
        // in this code:
        //   let data = require(packageJsonPath);
        //
        new webpack.ContextReplacementPlugin(
            // Whenever there is a dynamic require that webpack can't analyze at all (i.e. resourceRegExp=/^\./), ...
            /^\./,
            // CONSIDER: Is there a type for the context argument?  Can't seem to find one.
            (context: any): void => {
                // ... and the call was from within node_modules/ms-rest/lib...
                if (/node_modules[/\\]ms-rest[/\\]lib/.test(context.context)) {
                    /* CONSIDER: Figure out how to make this work properly.
                        // ... tell webpack that the call may be loading any of the package.json files from the 'node_modules/azure-arm*' folders
                        // so it will include those in the package to be available for lookup at runtime
                        context.request = path.resolve(options.projectRoot, 'node_modules');
                        context.regExp = /azure-arm.*package\.json/;
                    */

                    // In the meantime, just ignore the error by telling webpack we've solved the critical dependency issue.
                    // The consequences of ignoring this error are that
                    //   the Azure SDKs (e.g. azure-arm-resource) don't get their info stamped into the user agent info for their calls.
                    for (const d of context.dependencies) {
                        if (d.critical) {
                            d.critical = false;
                        }
                    }
                }
            })
    ],
    resolve: { // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        alias: {
            'handlebars' : 'handlebars/dist/handlebars.js'
        },
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader'
                }]
            },
            {
                // vscode-nls-dev loader:
                // * rewrite nls-calls
                loader: 'vscode-nls-dev/lib/webpack-loader',
                options: {
                    base: path.join(__dirname, 'src')
                }
            }
        ]
    },
}

export default config;
