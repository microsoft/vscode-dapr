declare module 'gulp-eslint' {

    interface ESLintResults {
        errorCount: number;
        length: number;
        warningCount: number;
    }

    type ResultsCallback = (results: ESLintResults) => void;

    interface ESLintFunc {
        (): NodeJS.ReadWriteStream;
        failAfterError(): NodeJS.ReadWriteStream;
        format(): NodeJS.ReadWriteStream;
        results(callback: ResultsCallback): NodeJS.ReadWriteStream;
    }

    const eslint: ESLintFunc;

    export = eslint;
}
