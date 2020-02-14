import * as gulp from 'gulp';
import * as ts from 'gulp-typescript';

function buildTask(): NodeJS.ReadWriteStream {
    const tsProject = ts.createProject('./tsconfig.json');

    if (!tsProject.options.outDir) {
        throw new Error('No outDir in tsconfig.json');
    }

    return tsProject.src()
        .pipe(tsProject()).js
        .pipe(gulp.dest(tsProject.options.outDir));
}

gulp.task('build', buildTask);

gulp.task('default', buildTask);
