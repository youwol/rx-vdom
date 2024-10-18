/**
 * Gathers the types involved in {@link VirtualDOM}'s API.
 *
 */
import type * as CSS from 'csstype'
import { RxHTMLElement, VirtualDOM } from './virtual-dom'
import { SupportedHTMLTags } from './factory'
import { ReactiveTrait } from './core'
import { WritablePart } from './type-utils'
import type {
    Observable as ObservableRxjs,
    Subscription as SubscriptionRxjs,
} from 'rxjs'
/**
 * Trait for a reactive (un-tagged) HTML element.
 * This class extends the standard HTMLElement with additional properties defined by {@link ReactiveTrait}.
 * For tag-specific elements, refer to {@link RxHTMLElement}.
 */
export class RxElementTrait extends ReactiveTrait(HTMLElement) {}

/**
 * Required interface representing the RxJS concept of an 'Observable'.
 * This interface includes only the `subscribe` method from the full RxJS Observable.
 *
 * @template T The type of values emitted by the observable.
 */
export type Observable<T> = Pick<ObservableRxjs<T>, 'subscribe'>

/**
 * Required interface for Rx concept of 'Subscription', as defined by RxJS.
 */
export type Subscription = Pick<SubscriptionRxjs, 'unsubscribe'>

/**
 * The union of all possible static attribute types for a virtual DOM.
 * Corresponding reactive attribute types are constructed on top of these, see {@link AttributeLike}.
 */
export type AnyHTMLAttribute =
    | string
    | number
    | boolean
    | CSSAttribute
    | CustomAttribute

/**
 * Type union of all possible virtual DOM types, defined by the {@link VirtualDOM} `tag` attribute.
 * Example:
 * ```
 * VirtualDOM<'a'> | VirtualDOM<'b'> | VirtualDOM<'br'> // etc.
 * ```
 */
export type AnyVirtualDOM = VirtualDOMTagNameMap[keyof VirtualDOMTagNameMap]

/**
 * Union of the types allowed to define an attribute in a {@link VirtualDOM}.
 * An attribute can be a direct type, an observable of that type, or a reactive attribute.
 *
 * @template Target The type of the HTML attribute.
 */
export type AttributeLike<Target extends AnyHTMLAttribute> =
    | Target
    | Observable<Target>
    | RxAttribute<unknown, Target>

/**
 * The attributes of any `HTMLElement` that should not be mapped into a {@link VirtualDOM} attribute.
 * See also {@link FilterHTMLMembers}.
 */
export type BlackListed = 'toString'

/**
 * CSS attribute type, as defined by the [csstype](https://github.com/frenic/csstype) library.
 *
 * > It is possible to substitute a target property name containing hyphens with uppercase letters in the virtual DOM.
 * For example, if `text-align='justify'` is expected in the real DOM, it can be provided as:
 * ```typescript
 * { textAlign: 'justify' }
 * ```
 */
export type CSSAttribute = CSS.Properties

/**
 * Union of the types allowed to define a child in a {@link VirtualDOM}.
 * This includes virtual DOM elements, standard HTML elements, or reactive child elements.
 */
export type ChildLike = AnyVirtualDOM | HTMLElement | RxChild

/**
 * Union of the types allowed to define children in a {@link VirtualDOM}.
 * This includes arrays of children or reactive children with various policies.
 */
export type ChildrenLike =
    | ChildLike[]
    | RxChildren<'replace'>
    | RxChildren<'append'>
    | RxChildren<'sync'>

/**
 * API for the `append` policy of {@link RxChildren}.
 *
 * This type defines the options available for appending children when the `append` policy is used.
 * Examples can be found [here](https://github.com/youwol/rx-vdom/blob/main/src/tests/rx-children-append.test.ts).
 *
 * @template TDomain The type of the domain data conveyed by the `source$` observable.
 */
export type ChildrenOptionsAppend<TDomain> = {
    /**
     * Observable source of domain data, expected to emit an array of domain data elements.
     */
    source$: Observable<TDomain[]>
    /**
     * Mapping function that transforms a single element of the emitted domain data into its corresponding
     * virtual DOM representation.
     *
     * @param domainData A single element emitted by `source$`.
     * @returns The virtual DOM representation of the given domain data.
     */
    vdomMap: (domainData: TDomain) => AnyVirtualDOM

    /**
     * A callback function for executing side effects after the children have been updated.
     *
     * @param parent The parent element containing the appended children.
     * @param update An object describing the rendering update, including added, updated, and removed elements.
     */
    sideEffects?: (
        parent: RxElementTrait,
        update: RenderingUpdate<TDomain>,
    ) => void

    /**
     * Optional function for specifying the order of children in the parent element.
     * The order is determined by comparing two domain data elements.
     *
     * @param d1 The domain data associated with the first element for comparison.
     * @param d2 The domain data associated with the second element for comparison.
     * @returns A value indicating the relative order of the two elements:
     * - A positive value (`> 0`) indicates `d1` should be sorted after `d2`.
     * - A negative value (`< 0`) indicates `d1` should be sorted before `d2`.
     */
    orderOperator?: (d1: TDomain, d2: TDomain) => number
}

/**
 * API for the `replace` policy of {@link RxChildren}.
 *
 * This type defines the options available for replacing children when the `replace` policy is used.
 * Examples can be found [here](https://github.com/youwol/rx-vdom/blob/main/src/tests/rx-children-replace.test.ts).
 *
 * @template TDomain The type of the domain data conveyed by the `source$` observable.
 */
export type ChildrenOptionsReplace<TDomain> = {
    /**
     * Observable source of domain data.
     */
    source$: Observable<TDomain>
    /**
     * Mapping function that transforms the emitted domain data into a list of virtual DOM elements.
     *
     * @param domainData The domain data emitted by `source$`.
     * @returns A list of virtual DOM elements that will replace the previous children.
     */
    vdomMap: (domainData: TDomain) => AnyVirtualDOM[]

    /**
     * Virtual DOM elements displayed until the first data is emitted by `source$`.
     */
    untilFirst?: AnyVirtualDOM[]

    /**
     * Optional transformation function for the virtual DOM elements returned by `vdomMap`.
     * This is useful for applying common transformations before setting the children.
     *
     * @param domValue The array of virtual DOM elements returned by `vdomMap`.
     * @returns The transformed array of virtual DOM elements.
     */
    wrapper?: (domValue: AnyVirtualDOM[]) => AnyVirtualDOM[]

    /**
     * A callback function for executing side effects after the new children have been inserted
     * into the real DOM.
     *
     * @param element The parent element of the newly inserted children, along with the domain
     * data that was originally emitted by `source$`.
     */
    sideEffects?: (element: ResolvedHTMLElement<TDomain>) => void
}

/**
 * API for the `sync` policy of {@link RxChildren}.
 *
 * This type defines the options available for synchronizing children when the `sync` policy is used.
 * Examples can be found [here](https://github.com/youwol/rx-vdom/blob/main/src/tests/rx-children-sync.test.ts).
 *
 * @template TDomain The type of the domain data conveyed by the `source$` observable.
 */
export type ChildrenOptionsSync<TDomain> = ChildrenOptionsAppend<TDomain> & {
    /**
     * A function to compare two domain data instances for equality.
     *
     * By default, reference equality is used for comparisons.
     *
     * @param d1 The first domain data for comparison.
     * @param d2 The second domain data for comparison.
     * @returns `true` if `d1` and `d2` represent the same element; `false` otherwise.
     */
    comparisonOperator?: (d1: TDomain, d2: TDomain) => boolean
}

/**
 * Represents the various policies available for managing children in {@link RxChildren}.
 *
 * The available policies are:
 * - **replace**: All children are replaced each time new item(s) are emitted by `source$`.
 * - **append**: All children are appended with each emission of new item(s) from `source$`.
 * - **sync**: Only updated, new, or deleted children are synchronized when `source$` emits a 'store' of
 *   `DomainData`, which typically consists of an immutable list of `DomainData`.
 */
export type ChildrenPolicy = 'replace' | 'append' | 'sync'

/**
 * A type helper that maps individual `ChildrenPolicy` values to their corresponding API options.
 *
 * This type provides a structure for defining the available options for each
 * policy when managing child elements in the virtual DOM.
 *
 * @template TDomain The type of the domain data conveyed by the `source$` observable.
 */
export type ChildrenTypesOptionMap<TDomain> = {
    /**
     * Options for the `replace` policy, defining how child elements should be replaced.
     */
    replace: ChildrenOptionsReplace<TDomain>
    /**
     * Options for the `append` policy, defining how child elements should be appended.
     */
    append: ChildrenOptionsAppend<TDomain>
    /**
     * Options for the `sync` policy, defining how child elements should be synchronized.
     */
    sync: ChildrenOptionsSync<TDomain>
}

/**
 * Represents custom attributes for HTML elements.
 *
 * Custom attributes can be defined using camelCase property names in the virtual DOM.
 * For example, if `aria-expanded='true'` is expected in the real DOM, it can be provided as:
 * ```typescript
 * { ariaExpanded: true }
 * ```
 */
export type CustomAttribute = { [key: string]: string | boolean | number }

/**
 * Extracts the attributes of an `HTMLElement` of the given tag that are exposed in {@link VirtualDOM}.
 *
 * This type includes:
 * - Most writable properties of primitive types (`string`, `number`, `boolean`), with some restrictions
 *   (see {@link FilterHTMLMembers}) to provide a lighter API. Notable transformations include:
 *   - `tag`/`tagName` and `class`/`className`.
 * - All signal handlers, which are any methods starting with the prefix `on` (e.g., `onclick`, `onmousedown`, etc.).
 *
 * @template TargetNativeHTMLElement The target native HTML element, which extends `HTMLElement`.
 */
export type ExposedMembers<TargetNativeHTMLElement extends HTMLElement> = {
    [Property in keyof FilterHTMLMembers<TargetNativeHTMLElement>]: TargetNativeHTMLElement[Property] extends string
        ? AttributeLike<string>
        : TargetNativeHTMLElement[Property] extends number
          ? AttributeLike<number>
          : TargetNativeHTMLElement[Property] extends boolean
            ? AttributeLike<boolean>
            : Property extends `on${string}`
              ? TargetNativeHTMLElement[Property]
              : never
}

/**
 * Selects the writable HTML attributes for a given tag to be exposed in {@link VirtualDOM}.
 *
 * This type filters out the following from the writable attributes:
 * - Properties defined by a {@link VirtualDOM} itself, including:
 *   - `className` and `tagName`, which are exposed as `class` and `tag`, respectively.
 * - Members listed in {@link BlackListed}.
 *
 * @template TargetNativeHTMLElement The target native HTML element, which extends `HTMLElement`.
 */
export type FilterHTMLMembers<TargetNativeHTMLElement extends HTMLElement> =
    Omit<
        WritablePart<TargetNativeHTMLElement>,
        | 'tag'
        | 'tagName'
        | 'className'
        | 'children'
        | 'style'
        | 'customAttributes'
        | 'connectedCallback'
        | 'disconnectedCallback'
        | BlackListed
    >

/**
 * Represents the native HTML element type corresponding to a specific tag.
 * For example, `NativeHTMLElement<'div'>` resolves to `HTMLDivElement`.
 *
 * @template Tag The tag name of the DOM element, constrained to `SupportedHTMLTags`.
 */
export type NativeHTMLElement<Tag extends SupportedHTMLTags> =
    HTMLElementTagNameMap[Tag]

/**
 * Describes the changes made to DOM elements when using {@link RxChildren}
 * with the `append` or `sync` policies.
 *
 * This type encapsulates the details of the rendering update, including
 * elements that have been added, updated, or removed during the operation.
 *
 * @template TDomain The type of the domain data conveyed by the `source$` observable.
 */
export type RenderingUpdate<TDomain> = {
    /**
     * An array of elements that have been added to the DOM.
     */
    added: ResolvedHTMLElement<TDomain>[]
    /**
     * An array of elements that have been updated in the DOM.
     */
    updated: ResolvedHTMLElement<TDomain>[]
    /**
     * An array of elements that have been removed from the DOM.
     */
    removed: ResolvedHTMLElement<TDomain>[]
}

/**
 * Encapsulates an HTML element along with the domain data that was used to create it.
 *
 * @template TDomain The type of the domain data conveyed by the `source$` observable.
 * @template Tag The type of the HTML tag, which extends `SupportedHTMLTags`.
 */
export type ResolvedHTMLElement<
    TDomain,
    Tag extends SupportedHTMLTags = SupportedHTMLTags,
> = {
    /**
     * The domain data associated with this element.
     * This will be `undefined` if the child was defined using a plain HTMLElement
     * rather than through a reactive construct.
     */
    domainData?: TDomain

    /**
     * The actual DOM element that also implements the {@link RxElementTrait} trait.
     */
    element: RxHTMLElement<Tag>
}

/**
 * Full specification of a reactive attribute in a virtual DOM context.
 *
 * Examples can be found in the test suite
 * [here](https://github.com/youwol/rx-vdom/blob/main/src/tests/rx-attributes.test.ts).
 *
 * @template TDomain The type of the domain data conveyed by the `source$` observable.
 * @template Target The type of the target attribute, which can be one of the following:
 * - `string` for attributes like `id`, `class`, `src`, etc.
 * - `number` for attributes like `width`, `height`, `min`, `max`, etc.
 * - `boolean` for attributes like `disabled`, `checked`, `readonly`, etc.
 * - `{ [k: string]: string }` for style attributes, for example.
 */
export type RxAttribute<
    TDomain = unknown,
    Target extends AnyHTMLAttribute = AnyHTMLAttribute,
> = {
    /**
     * The source observable that emits domain data.
     */
    source$: Observable<TDomain>

    /**
     * A mapping function that transforms the domain data into the actual attribute value.
     *
     * @param domainData The domain data emitted by the `source$`.
     * @returns The attribute value corresponding to the given domain data.
     */
    vdomMap: (domainData: TDomain) => Target

    /**
     * The initial value of the attribute to be displayed until the first data is emitted by `source$`.
     * This can be useful for providing a default state.
     */
    untilFirst?: Target

    /**
     * A transformation function applied to the value returned by `vdomMap`
     * before it is set as the attribute. This is useful for applying common
     * transformations to the attribute value.
     *
     * @param domValue The value of the attribute returned by `vdomMap`.
     * @returns The transformed attribute value that will be set.
     */
    wrapper?: (domValue: Target) => Target

    /**
     * A callback function for executing side effects after the attribute value has been
     * updated in the actual DOM. This can be useful for integrating with other libraries
     * or performing actions that depend on the updated DOM state.
     *
     * @param element The updated element, along with the domain data
     * that was originally emitted by `source$`.
     */
    sideEffects?: (element: ResolvedHTMLElement<TDomain>) => void
}

/**
 * Full specification of a reactive child component.
 *
 * <note level="hint">
 * If the `vdomMap` or `wrapper` attributes return `undefined`, no `HTMLElement` will be produced.
 * </note>
 *
 * For examples, see [here](https://github.com/youwol/rx-vdom/blob/main/src/tests/rx-child.test.ts).
 *
 * @template TDomain The type of the domain data conveyed by the `source$` observable.
 * @template TVdomMap The type of the virtual DOM returned by the `vdomMap` function.
 * @template TVdomFinal The type of the final virtual DOM that will be inserted into the DOM.
 */
export type RxChild<
    TDomain = unknown,
    TVdomMap extends AnyVirtualDOM = AnyVirtualDOM,
    TVdomFinal extends AnyVirtualDOM = TVdomMap,
> = {
    /**
     * The source observable that emits domain data.
     */
    source$: Observable<TDomain>

    /**
     * A mapping function that transforms the domain data into the associated {@link VirtualDOM}.
     *
     * @param domainData The domain data emitted by the `source$`.
     * @returns The virtual DOM representation based on the provided domain data.
     */
    vdomMap: (domainData: TDomain) => TVdomMap

    /**
     * The initial virtual DOM to be displayed until the first data is emitted by `source$`.
     * This is useful for providing a placeholder or loading state.
     */
    untilFirst?: AnyVirtualDOM

    /**
     * A transformation function applied to the virtual DOM returned by `vdomMap`
     * before it is set as a child. This is useful for applying common transformations
     * to the virtual DOM.
     *
     * @param domValue The virtual DOM value returned by `vdomMap`.
     * @returns The transformed virtual DOM that will be used as the final child.
     */
    wrapper?: (domValue: TVdomMap) => TVdomFinal

    /**
     * A callback function for executing side effects after the new child has been
     * updated in the actual DOM. This can be useful for integrating with other
     * libraries or performing actions that depend on the updated DOM state.
     *
     * @param element The newly inserted child element, along with the domain data
     * that was originally emitted by `source$`.
     */
    sideEffects?: (
        element: ResolvedHTMLElement<TDomain, TVdomFinal['tag']>,
    ) => void
}

/**
 * Full specification of reactive children in a virtual DOM context.
 *
 * Example usage and policies can be found in the following documents:
 * - **replace**: {@link ChildrenOptionsReplace}
 * - **append**: {@link ChildrenOptionsAppend}
 * - **sync**: {@link ChildrenOptionsSync}
 *
 * @template Policy The policy to be used for managing children, which can be one of the following:
 *   - `replace`: Replaces existing children with new ones.
 *   - `append`: Appends new children to the existing ones.
 *   - `sync`: Synchronizes the state of children based on the domain data.
 *   Refer to {@link ChildrenPolicy} for more details on available policies.
 * @template TDomain The type of the domain data conveyed by the `source$` observable.
 */
export type RxChildren<Policy extends ChildrenPolicy, TDomain = unknown> = {
    /**
     * The policy defining how children should be managed.
     */
    policy: Policy
} & ChildrenTypesOptionMap<TDomain>[Policy]

/**
 * A mapping between possible HTML tag names, as defined in `HTMLElementTagNameMap`,
 * and their associated {@link VirtualDOM} representations.
 *
 * This type creates a dynamic mapping, where each key is a valid HTML tag from `SupportedHTMLTags`,
 * and the corresponding value is a {@link VirtualDOM} for that tag.
 */
export type VirtualDOMTagNameMap = {
    [Property in SupportedHTMLTags]: VirtualDOM<Property>
}
