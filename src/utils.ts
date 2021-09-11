export class Deferred<T> implements PromiseLike<T> {
    _resolve?: (item: T) => void
    _reject?: (err: Error) => void
    promise: PromiseLike<T>

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve
            this._reject = reject
        })
    }

    resolve(item: T) {
        if (this._resolve) {
            this._resolve(item)
        }
    }

    reject(err: Error) {
        if (this._reject) {
            this._reject(err)
        }
    }

    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): PromiseLike<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, onrejected)
    }

}
