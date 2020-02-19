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

const languages: nls.Language[] = [
    { folderName: 'jpn', id: 'ja' }
];

const tsProject = ts.createProject('./tsconfig.json');

function getOutDir(): string {
    if (!tsProject.options.outDir) {
        throw new Error('outDir is not defined in tsconfig.json.');
    }

    return tsProject.options.outDir;
}

function wrapThroughStream(stream: nls.ThroughStream): NodeJS.ReadWriteStream {
    return (stream as unknown) as NodeJS.ReadWriteStream;
}

function cleanTask(): Promise<string[]> {
    return del([getOutDir(), 'package.nls.*.json', 'vscode-dapr-*.vsix']);
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

function addI18nTask() {
    return gulp.src(['package.nls.json'])
        .pipe(wrapThroughStream(nls.createAdditionalLanguageFiles(languages, 'i18n')))
        .pipe(gulp.dest('.'));
}

function testTask() {
    return cp.spawn('node', ['./out/test/runTest.js'], { stdio: 'inherit' });
}

function vscePackageTask() {
    return vsce.createVSIX();
}

const buildTask = gulp.series(cleanTask, compileTask, addI18nTask);

gulp.task('clean', cleanTask);

gulp.task('lint', lintTaskFactory());

gulp.task('build', buildTask);

gulp.task('test', gulp.series(buildTask, testTask));

gulp.task('package', gulp.series(buildTask, vscePackageTask));

gulp.task('ci-build', gulp.series(buildTask, lintTaskFactory(/* warningsAsErrors: */ true)));

gulp.task('ci-package', gulp.series(buildTask, lintTaskFactory(/* warningsAsErrors: */ true), vscePackageTask));

gulp.task('default', buildTask);
