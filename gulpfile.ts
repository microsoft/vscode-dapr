// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as del from 'del';
import * as gulp from 'gulp';
import * as sourcemaps from 'gulp-sourcemaps';
import * as ts from 'gulp-typescript';

const tsProject = ts.createProject('./tsconfig.json');

function getOutDir(): string {
    if (!tsProject.options.outDir) {
        throw new Error('outDir is not defined in tsconfig.json.');
    }

    return tsProject.options.outDir;
}

function cleanTask(): Promise<string[]> {
    return del([getOutDir()]);
}

function compileTask(): NodeJS.ReadWriteStream {
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject()).js
        .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: './' }))
        .pipe(gulp.dest(getOutDir));
}

const buildTask = gulp.series(cleanTask, compileTask);

gulp.task('build', buildTask);

gulp.task('default', buildTask);
