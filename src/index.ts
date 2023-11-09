/**
 *
 * Introducing a declarative & reactive DOM tree structure.
 *
 * Key features of the library includes:
 * *  **Compact Size & Dependency Free**: The compressed bundle size is less than 4kB. Reactivity,
 * powered by reactive programming primitives, is opted into by the consumer
 * (usually through the use of [RxJS](https://rxjs.dev/).
 * *  **Simple & Consistent API**: The API surface essentially comes down to 4 data-structures:
 *      *  {@link API.RxAttribute}: definition of a reactive attribute.
 *      *  {@link API.ChildrenOptionsAppend}: definition of an append only reactive children list.
 *      *  {@link API.ChildrenOptionsReplace}: definition of a replacement only reactive children list.
 *      *  {@link API.ChildrenOptionsSync}: definition of a synchronized reactive children list.
 * *  **Type Safety**: the library is supported by the strongly-typed {@link VirtualDOM} structure.
 * It offers robust type checking and inline guidance within TypeScript environment.
 *
 * Introducing reactive programing primitives into the DOM opens up powerful opportunities for expressing reactivity.
 * Moreover, when compared to other frameworks, there is an efficiency advantage because updates
 * are explicit, eliminating the need for time-consuming calculations of differences and/or change detection.
 *
 * To get started, please refer to the {@link VirtualDOM | VirtualDOM documentation}.
 *
 *  @module
 */
export * from './lib'
export { setup as webpmSetup } from './auto-generated'
// noinspection ES6UnusedImports -- used for the documentation
import type {
    // eslint-disable-next-line unused-imports/no-unused-imports -- used for documentation
    API,
} from './lib'
