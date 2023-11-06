import { Observable } from 'rxjs'
import { VirtualDOM } from './virtual-dom'
import { SupportedTags } from './factory'
import { ReactiveTrait } from './core'

/**
 * Common API of all {@link RxHTMLElement}.
 */
export class RxElementTrait extends ReactiveTrait(HTMLElement) {}

/**
 * The attributes of any `HTMLElement` that should not be mapped into a {@link VirtualDOM} attribute
 * (see {@link ExposedMembers}).
 *
 * A property of any `HTMLElement` is considered an attribute if its type is in ``` string | boolean | number ```
 *
 * */
export type BlackListed = 'toString'

/**
 * Remove a couple of HTML attributes for a given tag that should not be exposed in {@link VirtualDOM}.
 *
 * It gathers:
 * *  the properties defined by a {@link VirtualDOM} itself. Note that `className` and `tagName` are removed to
 * expose them as `class` and `tag`.
 * *  a list of {@link BlackListed} members
 *
 *
 * @template Tag the `tag` of the DOM element.
 */
export type RemoveUnwantedMembers<Tag extends SupportedTags> = Omit<
    HTMLElementTagNameMap[Tag],
    | 'tag'
    | 'tagName'
    | 'className'
    | 'children'
    | 'connectedCallback'
    | 'disconnectedCallback'
    | BlackListed
>

/**
 * Full specification of a reactive attribute.
 *
 * @template Target the type of the target attribute, e.g.:
 * * `string` for attributes `id`, `class`, `src`, *etc*.
 * * `number` for attributes `width`, `height`, `min`, `max`, *etc*.
 * * `boolean` for attributes `disabled`, `checked`, `readonly`, *etc*.
 * @template TDomain type of the domain data (conveys by the `source$` observable)
 */
export type RxAttribute<Target, TDomain = unknown> = {
    /**
     * Source of domain data.
     */
    source$: Observable<TDomain>

    /**
     * Mapping function between domain data and actual attribute type
     * @param domainData domainData emitted by the `source$`.
     */
    vdomMap: (domainData: TDomain) => Target

    /**
     * Value of the attribute until a first data is emitted by `source$`.
     */
    untilFirst?: Target

    /**
     * If provided, apply a last transformation of the data returned by `vdomMap` before being actually set as
     * attribute. Useful to factorize some transformations.
     *
     * @param domValue value of the attribute returned by `vdomMap`.
     */
    wrapper?: (domValue: Target) => Target

    /**
     * Provide a handle to execute side effects. This is executed just after the attribute value has been updated
     * in the (real) DOM.
     * @param element the updated element along with the domain data that was originally
     * emitted by `source$`.
     */
    sideEffects?: (element: ResolvedHTMLElement<TDomain>) => void
}

/**
 * Union of the types allowed to define an attribute in a {@link VirtualDOM}.
 */
export type AttributeLike<Target> =
    | Target
    | Observable<Target>
    | RxAttribute<Target>

/**
 * Extract the attributes & methods of an HTMLElement of given tag that are exposed in {@link VirtualDOM}.
 * It includes:
 * *  most of the properties of primitive types (`string`, `number`, `boolean`), only a few restriction provided by
 * {@link RemoveUnwantedMembers} are used
 * (essentially to provide a lighter API, see  `tag`/`tagName`, and `class`/`className`).
 * *  all the signal handlers: any methods starting with the prefix `on` (e.g. `onclick`, `onmousedown`, *etc*).
 *
 * @template Tag the `tag` of the DOM element.
 */
export type ExposedMembers<Tag extends SupportedTags> = {
    [Property in keyof RemoveUnwantedMembers<Tag>]: HTMLElementTagNameMap[Tag][Property] extends string
        ? AttributeLike<string>
        : HTMLElementTagNameMap[Tag][Property] extends number
        ? AttributeLike<number>
        : HTMLElementTagNameMap[Tag][Property] extends boolean
        ? AttributeLike<boolean>
        : Property extends `on${string}`
        ? HTMLElementTagNameMap[Tag][Property]
        : never
}

/**
 * Mapping between the possible tag name as defined in `HTMLElementTagNameMap` and the associated {@link VirtualDOM}.
 */
export type VirtualDOMTagNameMap = {
    [Property in SupportedTags]: VirtualDOM<Property>
}

/**
 * Type union of all possible virtual DOM types (the {@link VirtualDOM} `tag` attribute).
 * i.e.:
 * ```
 * VirtualDOM<'a'> | VirtualDOM<'b'> | VirtualDOM<'br'> // etc
 * ```
 */
export type AnyVirtualDOM = VirtualDOMTagNameMap[keyof VirtualDOMTagNameMap]

/**
 * Full specification of a reactive child.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type RxChild<TDomain = unknown> = {
    /**
     * Source of domain data.
     */
    source$: Observable<TDomain>

    /**
     * Mapping function between domain data and associated {@link VirtualDOM}.
     * @param domainData domainData emitted by the `source$`.
     */
    vdomMap: (domainData: TDomain) => VirtualDOM

    /**
     * Virtual DOM displayed until a first data is emitted by `source$`.
     */
    untilFirst?: VirtualDOM

    /**
     * If provided, apply a last transformation of the virtual DOM returned by `vdomMap` before being actually set as
     * child. Useful to factorize some transformations.
     *
     * @param domValue value of the attribute returned by `vdomMap`.
     */
    wrapper?: (domValue: VirtualDOM) => VirtualDOM

    /**
     * Provide a handle to execute side effects. This is executed just after the new child has been updated
     * in the (real) DOM.
     * @param element the inserted child along with the domain data that was originally
     * emitted by `source$`.
     */
    sideEffects?: (element: ResolvedHTMLElement<TDomain>) => void
}

/**
 * Various policies for {@link RxChildren} are available:
 * *  **replace**: All children are replaced each time a new item(s) is emitted by `source$`.
 * *  **append**: All children are appended at every emission of new item(s) from `source$`.
 * *  **sync**: Synchronize only the updated, new, or deleted children when `source$` emits a 'store' of DomainData,
 * which typically consists of an immutable DomainData list.
 */
export type ChildrenPolicy = 'replace' | 'append' | 'sync'

/**
 * API for the `append` policy of  {@link RxChildren}.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type ChildrenOptionsAppend<TDomain> = {
    /**
     * Source of domain data.
     */
    source$: Observable<TDomain[]>
    /**
     * Mapping between one `TDomain` element over those emitted by `source$` and its corresponding view.
     * @param domainData single element over those emitted by `source$`.
     */
    vdomMap: (domainData: TDomain) => VirtualDOM

    /**
     * Execute side effects once the children have been updated.
     *
     * @param parent parent of the children.
     * @param update description of the update.
     */
    sideEffects?: (
        parent: RxElementTrait,
        update: RenderingUpdate<TDomain>,
    ) => void

    /**
     * Specifies how the children are ordered in the parent element.
     * Order is defined using this callback.
     *
     * @param d1 Domain data associated to the first element for comparison
     * @param d2 Domain data associated to the second element for comparison
     * @return a value:
     * -    if `>0`, sort `d1` after `d2`
     * -    if `<0`, sort `d1` before `d2`
     */
    orderOperator?: (d1: TDomain, d2: TDomain) => number
}

/**
 * API for the `replace` policy of  {@link RxChildren}.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type ChildrenOptionsReplace<TDomain> = {
    /**
     * Source of domain data.
     */
    source$: Observable<TDomain>
    /**
     *
     * @param domainData domain data emitted by `source$`
     * @return the list of children that replace the previous one.
     */
    vdomMap: (domainData: TDomain) => VirtualDOM[]

    /**
     * Virtual DOMs displayed until a first data is emitted by `source$`.
     */
    untilFirst?: VirtualDOM[]

    /**
     * If provided, apply a last transformation of the virtual DOMs returned by `vdomMap` before being actually set as
     * children. Useful to factorize some transformations.
     *
     * @param domValue value of the attribute returned by `vdomMap`.
     */
    wrapper?: (domValue: VirtualDOM[]) => VirtualDOM[]

    /**
     * Provide a handle to execute side effects. This is executed just after the new children have been inserted
     * in the (real) DOM.
     * @param element the parent element of the children along with the domain data value that was originally
     * emitted by `source$`.
     */
    sideEffects?: (element: ResolvedHTMLElement<TDomain>) => void
}

/**
 * API for the `sync` policy of  {@link RxChildren}.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type ChildrenOptionsSync<TDomain> = ChildrenOptionsAppend<TDomain> & {
    /**
     * Default is to use reference equality.
     *
     * @param d1 first domain data for comparison.
     * @param d2 second domain data for comparison.
     * @return `true` if the `d1` and `d2` represents the same element, `false` otherwise.
     */
    comparisonOperator?: (d1: TDomain, d2: TDomain) => boolean
}

/**
 * Type helper to map individual `ChildrenPolicy` to its corresponding API.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type ChildrenTypesOptionMap<TDomain> = {
    replace: ChildrenOptionsReplace<TDomain>
    append: ChildrenOptionsAppend<TDomain>
    sync: ChildrenOptionsSync<TDomain>
}

/**
 * Full specification of reactive children.
 *
 * @template Policy policy to be used, either `replace`, `append` or `sync`, see {@link ChildrenPolicy}.
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type RxChildren<Policy extends ChildrenPolicy, TDomain = unknown> = {
    policy: Policy
} & ChildrenTypesOptionMap<TDomain>[Policy]

/**
 * Union of the types allowed to define a child in a {@link VirtualDOM}.
 */
export type ChildLike = AnyVirtualDOM | HTMLElement | RxChild

/**
 * Union of the types allowed to define children in a {@link VirtualDOM}.
 */
export type ChildrenLike =
    | ChildLike[]
    | RxChildren<'replace'>
    | RxChildren<'append'>
    | RxChildren<'sync'>

/**
 * Encapsulates and HTML element along with the domain data that originally created it.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type ResolvedHTMLElement<TDomain> = {
    /**
     * Domain data. If the child has been defined using a straight HTMLElement, it is `undefined`.
     */
    domainData?: TDomain

    /**
     * The actual DOM element with {@link RxElementTrait} trait.
     */
    element: RxElementTrait
}

/**
 * Describes an update when a DOM elements has been updated when using {@link RxChildren}
 * with policies `append` or `sync`.
 *
 */
export type RenderingUpdate<TDomain> = {
    added: ResolvedHTMLElement<TDomain>[]
    updated: ResolvedHTMLElement<TDomain>[]
    removed: ResolvedHTMLElement<TDomain>[]
}
