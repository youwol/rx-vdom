/**
 * Gathers low level operations on types.
 *
 * @module
 */

/**
 * Check whether 2 types are equals.
 *
 * See [type level equal operator](https://github.com/Microsoft/TypeScript/issues/27024) and
 * [distributive conditional types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types).
 *
 */
export type Equals<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
        ? true
        : false

/**
 * Extract the writable keys of a type.
 *
 * Taken from this [SO discussion](https://stackoverflow.com/questions/52443276/how-to-exclude-getter-only-properties-from-type-in-typescript)
 */
export type WritableKeysOf<T> = {
    [P in keyof T]: Equals<
        { [Q in P]: T[P] },
        { -readonly [Q in P]: T[P] }
    > extends true
        ? P
        : never
}[keyof T]

/**
 * Extract writable part of a type.
 *
 * @template T type to transform
 */
export type WritablePart<T> = Pick<T, WritableKeysOf<T>>
