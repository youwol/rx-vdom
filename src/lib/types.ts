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
 * Type union of all possible VirtualDom types (regarding the {@link VirtualDOM} `tag` attribute).
 * i.e.:
 * ```
 * VirtualDom<'a'> | VirtualDom<'b'> | VirtualDom<'br'> // etc
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
 * Available policy for {@link RxChildren}:
 * *  `replace` : all children are replaced at every  ̀source$` emit a new item(s).
 *
 */
export type ChildrenPolicy = 'replace' | 'append' | 'sync'

/**
 * Factorize common options for the  'append' and 'sync' {@link RxChildren} policies.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type ChildrenOptionsAppendSyncCommon<TDomain> = {
    /**
     * Source of domain data.
     */
    source$: Observable<TDomain[]>
    /**
     * Mapping between one `TDomain` element over those emitted by `source$` and its corresponding view.
     * @param domainData single element over those emitted by `source$`.
     */
    vdomMap: (domainData: TDomain) => VirtualDOM
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
} & ChildrenTraitUpdate<TDomain> &
    ChildrenTraitOrdering<TDomain>

/**
 * API for the `append` policy of  {@link RxChildren}.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable of
 * {@link ChildrenOptionsAppendSyncCommon}).
 */
export type ChildrenOptionsAppend<TDomain> =
    ChildrenOptionsAppendSyncCommon<TDomain> &
        ChildrenTraitUpdate<TDomain> &
        ChildrenTraitOrdering<TDomain>

/**
 * API for the `sync` policy of  {@link RxChildren}.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable of
 * {@link ChildrenOptionsAppendSyncCommon}).
 */
export type ChildrenOptionsSync<TDomain> =
    ChildrenOptionsAppendSyncCommon<TDomain> &
        ChildrenTraitUpdate<TDomain> &
        ChildrenTraitOrdering<TDomain> &
        ChildrenTraitComparison<TDomain>

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
 * Union of the types allowed to define a child.
 */
export type ChildLike = AnyVirtualDOM | HTMLElement | RxChild

/**
 * Union of the types allowed to define a list of children.
 */
export type ChildrenLike =
    | ChildLike[]
    | RxChildren<'replace'>
    | RxChildren<'append'>
    | RxChildren<'sync'>

/**
 * Specifies the side effects associated to an update of children.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type ChildrenTraitUpdate<TDomain> = {
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
}

/**
 * Specifies the order in which children are included in the parent element.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type ChildrenTraitOrdering<TDomain> = {
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
 * Specifies whether two domain data represents the same {@link VirtualDOM} (or {@link HTMLElement}).
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type ChildrenTraitComparison<TDomain> = {
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
 * Generalization of the HTMLElement concept: either a straight HTMLElement or a reactive one (RxHTMLElement).
 */
export type HTMLElementLike = HTMLElement | RxHTMLElementBase

/**
 * Encapsulates and HTML element along with the domainData that was originally emitted.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type ResolvedHTMLElement<TDomain> = {
    /**
     * Domain data. If the child has been defined using a straight HTMLElement, it is `undefined`.
     */
    domainData?: TDomain

    /**
     * The actual DOM element. If the child has been defined using a straight HTMLElement, its type is `HTMLElement`,
     * otherwise it is `RxHTMLElement`.
     */
    element: RxElementTrait
}

/**
 * Describes an update when a DOM element has been modified when using {@link RxChildren}
 * with policies `append` or `sync`.
 *
 * @category Reactive Children
 */
export type RenderingUpdate<TDomain> = {
    added: ResolvedHTMLElement<TDomain>[]
    updated: ResolvedHTMLElement<TDomain>[]
    removed: ResolvedHTMLElement<TDomain>[]
}
