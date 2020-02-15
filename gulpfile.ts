// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as del from 'del';
import * as gulp from 'gulp';
import * as nls from 'vscode-nls-dev';
import * as sourcemaps from 'gulp-sourcemaps';
import * as ts from 'gulp-typescript';

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
    return del([getOutDir(), 'package.nls.*.json']);
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

const buildTask = gulp.series(cleanTask, compileTask, addI18nTask);

gulp.task('build', buildTask);

gulp.task('default', buildTask);
