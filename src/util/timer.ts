export default class Timer {
    static Timeout(delay: number): Promise<void> {
        return new Promise(
            (resolve, reject) => {
                setTimeout(resolve, delay);
            });
    }
}