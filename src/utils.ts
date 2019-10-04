export type ResultSuccess<T> = {
  type: "success"
  payload: T
}

export function ResultSuccess<T>(payload: T): Result<T, never> {
  return {
    type: "success",
    payload,
  }
}

export type ResultError<E> = {
  type: "error"
  error: E
}

export function ResultError<E>(error: E): Result<never, E> {
  return {
    type: "error",
    error,
  }
}

export type Result<T, E = unknown> = ResultSuccess<T> | ResultError<E>

export function isSuccess<T, E>(
  result: Result<T, E>,
): result is ResultSuccess<T> {
  return result.type === "success"
}

/**
 * Helper function for exhaustive checks of discriminated unions.
 * https://basarat.gitbooks.io/typescript/docs/types/discriminated-unions.html
 * Modified by moljac024. Possibly made worse.
 *
 * @example
 *
 *    type A = {type: 'a'};
 *    type B = {type: 'b'};
 *    type Union = A | B;
 *
 *    function doSomething(arg: Union) {
 *      if (arg.type === 'a') {
 *        return something;
 *      }
 *
 *      if (arg.type === 'b') {
 *        return somethingElse;
 *      }
 *
 *      // TS will error if there are other types in the union
 *      // Will throw an Error when called at runtime.
 *      // Use `assertNever(arg, fallbackValue)` instead to fail silently.
 *      // Note that it will return the fallback value, so make sure it's
 *      // of the correct type! The fallback value cannot be undefined.
 *      return assertNever(arg);
 *    }
 */
export function assertNever(x: never, value?: any): any {
  if (value !== undefined) {
    return value
  }

  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(x)}`)
}
