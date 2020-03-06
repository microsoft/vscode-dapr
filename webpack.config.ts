// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

//
// Adapted from: https://github.com/microsoft/vscode-azuretools/blob/master/dev/src/webpack/getDefaultWebpackConfig.ts
//

import * as path from 'path';
import * as TerserPlugin from 'terser-webpack-plugin';
import * as webpack from 'webpack';

export const config: webpack.Configuration = {
    devtool: 'source-map',
    entry: './src/extension.ts',
    externals: {
        // Required by applicationinsights as a development dependency; not othewise needed.
        'applicationinsights-native-metrics': 'applicationinsights-native-metrics',

        // The vscode module is created on-the-fly and must be excluded.
        vscode: 'commonjs vscode'
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.ts$/,
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
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    // Don't mangle class names.  Otherwise parseError() will not recognize user cancelled errors (because their constructor name
                    // will match the mangled name, not UserCancelledError).  Also makes debugging easier in minified code.
                    keep_classnames: true,
                    
                    // Don't mangle function names. https://github.com/microsoft/vscode-azurestorage/issues/525
                    keep_fnames: true
                }
            })
        ]
    },
    output: {
        devtoolModuleFilenameTemplate: '../[resource-path]',
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        // Fix warning:
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
    resolve: {
        alias: {
            // Fix warning:
            //
            // > ./node_modules/handlebars/lib/index.js 22:38-56
            // > require.extensions is not supported by webpack. Use a loader instead.
            // >  @ ./src/scaffolding/templateScaffolder.ts 15:19-40
            // >  @ ./src/extension.ts
            // > ./node_modules/handlebars/lib/index.js 23:2-20
            // > require.extensions is not supported by webpack. Use a loader instead.
            // >  @ ./src/scaffolding/templateScaffolder.ts 15:19-40
            // >  @ ./src/extension.ts
            // > ./node_modules/handlebars/lib/index.js 24:2-20
            // > require.extensions is not supported by webpack. Use a loader instead.
            // >  @ ./src/scaffolding/templateScaffolder.ts 15:19-40
            // >  @ ./src/extension.ts
            //
            'handlebars' : 'handlebars/dist/handlebars.js'
        },
        extensions: ['.ts', '.js']
    },
    target: 'node'
}

export default config;
