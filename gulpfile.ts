// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as cp from 'child_process';
import * as del from 'del';
import * as eslint from 'gulp-eslint';
import * as gulp from 'gulp';
import * as nls from 'vscode-nls-dev';
import * as sourcemaps from 'gulp-sourcemaps';
import * as ts from 'gulp-typescript';
import * as vsce from 'vsce';
import * as webpack from 'webpack';

const webpackConfig: webpack.Configuration =  require('./webpack.config');

const languages: nls.Language[] = [
    { folderName: 'jpn', id: 'ja' }
];

const tsProject = ts.createProject('./tsconfig.json');

function getDistDir(): string {
    if (!webpackConfig.output?.path) {
        throw new Error('path is not defined in webpack.config.js');
    }

    return webpackConfig.output.path;
}

function getOutDir(): string {
    if (!tsProject.options?.outDir) {
        throw new Error('outDir is not defined in tsconfig.json.');
    }

    return tsProject.options.outDir;
}

function wrapThroughStream(stream: nls.ThroughStream): NodeJS.ReadWriteStream {
    return (stream as unknown) as NodeJS.ReadWriteStream;
}

function cleanTask(): Promise<string[]> {
    return del([getDistDir(), getOutDir(), 'package.nls.*.json', 'vscode-dapr-*.vsix']);
}

function lintTaskFactory(warningsAsErrors?: boolean) {
    return function lintTask() {
        let pipeline = gulp.src(['src/**/*.ts'])
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(eslint.failAfterError());

        if (warningsAsErrors) {
            pipeline = pipeline
                .pipe(eslint.results(
                    results => {
                        if (results.warningCount) {
                            throw new Error('ESLint generated warnings.');
                        }
                    }));
        }

        return pipeline;
    }
}

function compileTask(): NodeJS.ReadWriteStream {
    const outDir = getOutDir();

    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject()).js
        .pipe(wrapThroughStream(nls.rewriteLocalizeCalls()))
        .pipe(wrapThroughStream(nls.createAdditionalLanguageFiles(languages, 'i18n', outDir)))
        .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: './' }))
        .pipe(gulp.dest(outDir));
}

function compilePackedTaskFactory(mode: 'production' | 'development'): () => Promise<void> {
    return function compilePackedTask() {
        return new Promise(
            (resolve, reject) => {
                webpack(
                    {
                        ...webpackConfig,
                        mode
                    },
                    (err, stats) => {
                        if (err) {
                            return reject(err);
                        }

                        const info = stats.toJson();

                        if (stats.hasErrors()) {
                            return reject(new Error(info.errors.join('\n')));
                        }

                        if (stats.hasWarnings()) {
                            info.warnings.forEach(warning => console.warn(warning));
                        }

                        return resolve();
                    });
            });
    }
}

function addI18nTask() {
    return gulp.src(['package.nls.json'])
        .pipe(wrapThroughStream(nls.createAdditionalLanguageFiles(languages, 'i18n')))
        .pipe(gulp.dest('.'));
}

function testTask() {
    return cp.spawn('node', ['./out/test/runAllTests.js'], { stdio: 'inherit' });
}

function unitTestTask() {
    return cp.spawn('node', ['./out/test/runUnitTests.js'], { stdio: 'inherit' });
}

function vscePackageTask() {
    return vsce.createVSIX();
}

const buildTask = gulp.series(cleanTask, compileTask, addI18nTask);

const buildPackedTask = gulp.series(cleanTask, compilePackedTaskFactory('development'));

const ciBuildTask = gulp.series(cleanTask, compilePackedTaskFactory('production'), lintTaskFactory(/* warningsAsErrors: */ true), testTask);

gulp.task('clean', cleanTask);

gulp.task('lint', lintTaskFactory());

gulp.task('build', buildTask);

gulp.task('build-packed', buildPackedTask);

gulp.task('unit-test', gulp.series(buildTask, unitTestTask));

gulp.task('test', gulp.series(buildTask, testTask));

gulp.task('package', gulp.series(buildTask, vscePackageTask));

gulp.task('ci-build', ciBuildTask);

gulp.task('ci-package', gulp.series(ciBuildTask, vscePackageTask));

gulp.task('default', buildTask);
