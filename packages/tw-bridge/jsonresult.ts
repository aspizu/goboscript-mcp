import {err, ok, type Result} from "neverthrow"

export type JSONOk<T> = {isOk: true; value: T}
export type JSONErr<E> = {isOk: false; error: E}
export type JSONResult<T, E> = JSONOk<T> | JSONErr<E>

export function intoResult<T>(result: JSONResult<T, string>): Result<T, Error> {
    if (result.isOk) {
        return ok(result.value)
    }
    return err(new Error(result.error))
}

export function fromResult<T>(result: Result<T, Error>): JSONResult<T, string> {
    if (result.isOk()) {
        return {isOk: true, value: result.value}
    }
    return {isOk: false, error: result.error.message}
}
