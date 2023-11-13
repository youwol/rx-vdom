/**
 * Gathers the types involved in {@link VirtualDOM}'s API.
 *
 * @module
 */
import type * as CSS from 'csstype'
import { RxHTMLElement, VirtualDOM } from './virtual-dom'
import { SupportedTags } from './factory'
import { ReactiveTrait } from './core'
import { WritablePart } from './type-utils'
import type {
    Observable as ObservableRxjs,
    Subscription as SubscriptionRxjs,
} from 'rxjs'
/**
 * Common API of all {@link RxHTMLElement}.
 */
export class RxElementTrait extends ReactiveTrait(HTMLElement) {}

/**
 * Required interface for Rx concept of 'Observable', as defined by RxJS.
 */
export type Observable<T> = Pick<ObservableRxjs<T>, 'subscribe'>

/**
 * Required interface for Rx concept of 'Subscription', as defined by RxJS.
 */
export type Subscription = Pick<SubscriptionRxjs, 'unsubscribe'>

/**
 * The union of all possible virtual DOM's **static** attribute types.
 * Corresponding **reactive** attribute types are constructed on top of them, see {@link AttributeLike}.
 */
export type AnyHTMLAttribute =
    | string
    | number
    | boolean
    | CSSAttribute
    | CustomAttribute

/**
 * Type union of all possible virtual DOM types (the {@link VirtualDOM} `tag` attribute).
 * i.e.:
 * ```
 * VirtualDOM<'a'> | VirtualDOM<'b'> | VirtualDOM<'br'> // etc
 * ```
 */
export type AnyVirtualDOM = VirtualDOMTagNameMap[keyof VirtualDOMTagNameMap]

/**
 * Union of the types allowed to define an attribute in a {@link VirtualDOM}.
 */
export type AttributeLike<Target extends AnyHTMLAttribute> =
    | Target
    | Observable<Target>
    | RxAttribute<unknown, Target>

/**
 * The attributes of any `HTMLElement` that should not be mapped into a {@link VirtualDOM} attribute
 * (see {@link FilterHTMLMembers}).
 *
 * */
export type BlackListed = 'toString'

/**
 * CSS attribute type, as defined by [csstype](https://github.com/frenic/csstype) library.
 *
 * > It is possible to substitute a target property name containing hyphens with uppercase letters in the virtual DOM.
 * e.g. if `text-align='justify'` is expected in the real DOM, it can be provided as ```{textAlign: 'justify'}```
 */
export type CSSAttribute = CSS.Properties

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
 * API for the `append` policy of  {@link RxChildren}.
 *
 * A typical example is as follows:
 *
 * <iframe id="iFrameExample_ChildrenOptionsAppend" src="" width="100%" height="850px"></iframe>
 * <script>
 *  const src = `<!--<!DOCTYPE html>
 * <html lang="en">
 *   <head><script src="https://webpm.org/^2.1.2/cdn-client.js"></script></head>
 *
 *   <body id="content"></body>
 *
 *   <script type="module">
 *      const cdnClient = window['@youwol/cdn-client']
 *      const { rxDom, rxjs } = await cdnClient.install({
 *          modules: ['@youwol/rx-vdom as rxDom',  'rxjs#^7.5.6'],
 *          displayLoadingScreen: true
 *      });
 *      const heroes = [
 *          {name:'Einstein', wiki:'Albert_Einstein'}, {name:'Planck', wiki: 'Max_Planck'},
 *          {name:'Schrödinger', wiki:'Erwin_Schrödinger'}, {name:'Feynman', wiki: 'Richard_Feynman'}
 *      ]
 *      const source$ = rxjs.timer(0, 1000).pipe(
 *          rxjs.map(() => [heroes[Math.floor(Math.random() * heroes.length)]])
 *      )
 *      const vDOM = {
 *          tag: 'div',
 *          children: {
 *              policy: 'append',
 *              source$,
 *              vdomMap: (hero) => ({
 *                  tag: 'div',
 *                  children:[
 *                      { tag: 'span', innerText: hero.name + ', '},
 *                      { tag: 'a', innerText: 'wikipedia', href: 'https://en.wikipedia.org/wiki'+hero.wiki }
 *                  ]
 *              })
 *          }
 *      };
 *      document.getElementById('content').appendChild(rxDom.render(vDOM));
 *   </script>
 * </html>
 * -->`
 *     const url = '/applications/@youwol/js-playground/latest?content='+encodeURIComponent(src.substring(4,src.length-4))
 *     document.getElementById('iFrameExample_ChildrenOptionsAppend').setAttribute("src",url);
 * </script>
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
    vdomMap: (domainData: TDomain) => AnyVirtualDOM

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
 * A typical example is as follows:
 *
 * <iframe id="iFrameExample_ChildrenOptionsReplace" src="" width="100%" height="850px"></iframe>
 * <script>
 *  const src = `<!--<!DOCTYPE html>
 * <html lang="en">
 *   <head><script src="https://webpm.org/^2.1.2/cdn-client.js"></script></head>
 *
 *   <body id="content"></body>
 *
 *   <script type="module">
 *      const cdnClient = window['@youwol/cdn-client']
 *      const { rxDom, rxjs } = await cdnClient.install({
 *          modules: ['@youwol/rx-vdom as rxDom',  'rxjs#^7.5.6'],
 *          displayLoadingScreen: true
 *      });
 *      const heroes = [
 *          {name:'Einstein', wiki:'Albert_Einstein'}, {name:'Planck', wiki: 'Max_Planck'},
 *          {name:'Schrödinger', wiki:'Erwin_Schrödinger'}, {name:'Feynman', wiki: 'Richard_Feynman'}
 *      ]
 *      const source$ = rxjs.timer(0, 1000).pipe(
 *          rxjs.map(() => {
 *              const indexes = new Set([1,2,3].map(()=>Math.floor(Math.random() * heroes.length)))
 *              return [...indexes].map((i)=>heroes[i])
 *          })
 *      )
 *      const vDOM = {
 *          tag: 'div',
 *          children: {
 *              policy: 'replace',
 *              source$,
 *              vdomMap: (heroes) => heroes.map((hero) => ({
 *                  tag: 'div',
 *                  children:[
 *                      { tag: 'span', innerText: hero.name + ', '},
 *                      { tag: 'a', innerText: 'wikipedia', href: 'https://en.wikipedia.org/wiki'+hero.wiki }
 *                  ]
 *              }))
 *          }
 *      };
 *      document.getElementById('content').appendChild(rxDom.render(vDOM));
 *   </script>
 * </html>
 * -->`
 *     const url = '/applications/@youwol/js-playground/latest?content='+encodeURIComponent(src.substring(4,src.length-4))
 *     document.getElementById('iFrameExample_ChildrenOptionsReplace').setAttribute("src",url);
 * </script>
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
    vdomMap: (domainData: TDomain) => AnyVirtualDOM[]

    /**
     * Virtual DOMs displayed until a first data is emitted by `source$`.
     */
    untilFirst?: AnyVirtualDOM[]

    /**
     * If provided, apply a last transformation of the virtual DOMs returned by `vdomMap` before being actually set as
     * children. Useful to factorize some transformations.
     *
     * @param domValue value of the attribute returned by `vdomMap`.
     */
    wrapper?: (domValue: AnyVirtualDOM[]) => AnyVirtualDOM[]

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
 * A typical example is as follows:
 *
 * <iframe id="iFrameExample_ChildrenOptionsSync" src="" width="100%" height="850px"></iframe>
 * <script>
 *  const src = `<!--<!DOCTYPE html>
 * <html lang="en">
 *   <head><script src="https://webpm.org/^2.1.2/cdn-client.js"></script></head>
 *
 *   <body id="content"></body>
 *
 *   <script type="module">
 *      const cdnClient = window['@youwol/cdn-client']
 *      const { rxDom, rxjs } = await cdnClient.install({
 *          modules: ['@youwol/rx-vdom as rxDom',  'rxjs#^7.5.6'],
 *          displayLoadingScreen: true
 *      });
 *      const heroes = [
 *          {name:'Einstein', wiki:'Albert_Einstein'}, {name:'Planck', wiki: 'Max_Planck'},
 *          {name:'Schrödinger', wiki:'Erwin_Schrödinger'}, {name:'Feynman', wiki: 'Richard_Feynman'}
 *      ]
 *      const source$ = rxjs.timer(0, 1000).pipe(
 *          rxjs.map(() => {
 *              const indexes = new Set([1,2,3].map(()=>Math.floor(Math.random() * heroes.length)))
 *              return [...indexes].map((i)=>heroes[i])
 *          })
 *      )
 *      const vDOM = {
 *          tag: 'div',
 *          children: {
 *              policy: 'sync',
 *              source$,
 *              vdomMap: (hero) => ({
 *                  tag: 'div',
 *                  children:[
 *                      { tag: 'span', innerText: hero.name + ', '},
 *                      { tag: 'a', innerText: 'wikipedia', href: 'https://en.wikipedia.org/wiki'+hero.wiki }
 *                  ]
 *              })
 *          }
 *      };
 *      document.getElementById('content').appendChild(rxDom.render(vDOM));
 *   </script>
 * </html>
 * -->`
 *     const url = '/applications/@youwol/js-playground/latest?content='+encodeURIComponent(src.substring(4,src.length-4))
 *     document.getElementById('iFrameExample_ChildrenOptionsSync').setAttribute("src",url);
 * </script>
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
 * Various policies for {@link RxChildren} are available:
 * *  **replace**: All children are replaced each time a new item(s) is emitted by `source$`.
 * *  **append**: All children are appended at every emission of new item(s) from `source$`.
 * *  **sync**: Synchronize only the updated, new, or deleted children when `source$` emits a 'store' of DomainData,
 * which typically consists of an immutable DomainData list.
 */
export type ChildrenPolicy = 'replace' | 'append' | 'sync'

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
 * Custom attributes type.
 *
 * > It is possible to substitute a target property name containing hyphens with uppercase letters in the virtual DOM.
 * e.g. if `aria-expanded='true'` is expected in the real DOM, it can be provided as ```{ariaExpanded: true}```.
 */
export type CustomAttribute = { [key: string]: string | boolean | number }

/**
 * Extract the attributes of an HTMLElement of given tag that are exposed in {@link VirtualDOM}.
 * It includes:
 * *  most of the writable properties of primitive types (`string`, `number`, `boolean`),
 * only a few restriction (see {@link FilterHTMLMembers}) are used
 * (essentially to provide a lighter API, see  `tag`/`tagName`, and `class`/`className`).
 * *  all the signal handlers: any methods starting with the prefix `on` (e.g. `onclick`, `onmousedown`, *etc.*).
 *
 * @template Tag the `tag` of the DOM element.
 */
export type ExposedMembers<Tag extends SupportedTags> = {
    [Property in keyof FilterHTMLMembers<Tag>]: NativeHTMLElement<Tag>[Property] extends string
        ? AttributeLike<string>
        : NativeHTMLElement<Tag>[Property] extends number
        ? AttributeLike<number>
        : NativeHTMLElement<Tag>[Property] extends boolean
        ? AttributeLike<boolean>
        : Property extends `on${string}`
        ? NativeHTMLElement<Tag>[Property]
        : never
}

/**
 * Select writable HTML attributes for a given tag to be exposed in {@link VirtualDOM}.
 *
 * From the writable attributes it removes:
 * *  the properties defined by a {@link VirtualDOM} itself. Note that `className` and `tagName` are removed to
 * expose them as `class` and `tag`.
 * *  a list of {@link BlackListed} members
 *
 *
 * @template Tag the `tag` of the DOM element.
 */
export type FilterHTMLMembers<Tag extends SupportedTags> = Omit<
    WritablePart<NativeHTMLElement<Tag>>,
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
 * Native HTMLElement per tag,
 * e.g. `NativeHTMLElement<'div'>` is `HTMLDivElement`.
 *
 * @template Tag the `tag` of the DOM element.
 */
export type NativeHTMLElement<Tag extends SupportedTags> =
    HTMLElementTagNameMap[Tag]

/**
 * Describes an update when DOM elements has been updated when using {@link RxChildren}
 * with policies `append` or `sync`.
 *
 */
export type RenderingUpdate<TDomain> = {
    added: ResolvedHTMLElement<TDomain>[]
    updated: ResolvedHTMLElement<TDomain>[]
    removed: ResolvedHTMLElement<TDomain>[]
}

/**
 * Encapsulates and HTML element along with the domain data that originally created it.
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type ResolvedHTMLElement<
    TDomain,
    Tag extends SupportedTags = SupportedTags,
> = {
    /**
     * Domain data. If the child has been defined using a straight HTMLElement, it is `undefined`.
     */
    domainData?: TDomain

    /**
     * The actual DOM element with {@link RxElementTrait} trait.
     */
    element: RxHTMLElement<Tag>
}

/**
 * Full specification of a reactive attribute.
 *
 * A typical example is as follows:
 *
 * <iframe id="iFrameExample_RxAttribute" src="" width="100%" height="550px"></iframe>
 * <script>
 *  const src = `<!--<!DOCTYPE html>
 * <html lang="en">
 *   <head><script src="https://webpm.org/^2.1.2/cdn-client.js"></script></head>
 *
 *   <body id="content"></body>
 *
 *   <script type="module">
 *      const cdnClient = window['@youwol/cdn-client']
 *      const { rxDom, rxjs } = await cdnClient.install({
 *          modules: ['@youwol/rx-vdom as rxDom', 'rxjs#^7.5.6'],
 *          displayLoadingScreen: true
 *      });
 *      const vDOM = {
 *          tag: 'div',
 *          innerText: {
 *              source$: rxjs.timer(0, 1000),
 *              vdomMap: (_) => 'It is : ' + new Date().toLocaleString()
 *          }
 *      };
 *      document.getElementById('content').appendChild(rxDom.render(vDOM));
 *   </script>
 * </html>
 * -->`
 *     const url = '/applications/@youwol/js-playground/latest?content='+encodeURIComponent(src.substring(4,src.length-4))
 *     document.getElementById('iFrameExample_RxAttribute').setAttribute("src",url);
 * </script>
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable)
 * @template Target the type of the target attribute, e.g.:
 * * `string` for attributes `id`, `class`, `src`, *etc.*.
 * * `number` for attributes `width`, `height`, `min`, `max`, *etc.*.
 * * `boolean` for attributes `disabled`, `checked`, `readonly`, *etc.*.
 * * `{ [k: string]: string }` for e.g. style.
 */
export type RxAttribute<
    TDomain = unknown,
    Target extends AnyHTMLAttribute = AnyHTMLAttribute,
> = {
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
 * Full specification of a reactive child.
 *
 * A typical example is as follows:
 *
 * <iframe id="iFrameExample_RxChild" src="" width="100%" height="550px"></iframe>
 * <script>
 *  const src = `<!--<!DOCTYPE html>
 * <html lang="en">
 *   <head><script src="https://webpm.org/^2.1.2/cdn-client.js"></script></head>
 *
 *   <body id="content"></body>
 *
 *   <script type="module">
 *      const cdnClient = window['@youwol/cdn-client']
 *      const { rxDom, rxjs } = await cdnClient.install({
 *          modules: ['@youwol/rx-vdom as rxDom', 'rxjs#^7.5.6'],
 *          displayLoadingScreen: true
 *      });
 *      const vDOM = {
 *          tag: 'div',
 *          children:[
 *              {
 *                  tag:'div',
 *                  innerText: 'It is:'
 *              },
 *              // Following is the RxChild definition:
 *              {
 *                  source$: rxjs.timer(0, 1000),
 *                  vdomMap: (_) => ({
 *                      tag: 'span',
 *                      innerText: new Date().toLocaleString()
 *                  })
 *              }
 *          ]
 *      };
 *      document.getElementById('content').appendChild(rxDom.render(vDOM));
 *   </script>
 * </html>
 * -->`
 *     const url = '/applications/@youwol/js-playground/latest?content='+encodeURIComponent(src.substring(4,src.length-4))
 *     document.getElementById('iFrameExample_RxChild').setAttribute("src",url);
 * </script>
 *
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 * @template TVdomMap type of the virtual DOM returned value of `vdomMap`.
 * @template TVdomFinal type of the virtual DOM inserted in the DOM.
 */
export type RxChild<
    TDomain = unknown,
    TVdomMap extends AnyVirtualDOM = AnyVirtualDOM,
    TVdomFinal extends AnyVirtualDOM = TVdomMap,
> = {
    /**
     * Source of domain data.
     */
    source$: Observable<TDomain>

    /**
     * Mapping function between domain data and associated {@link VirtualDOM}.
     * @param domainData domainData emitted by the `source$`.
     */
    vdomMap: (domainData: TDomain) => TVdomMap

    /**
     * Virtual DOM displayed until a first data is emitted by `source$`.
     */
    untilFirst?: AnyVirtualDOM

    /**
     * If provided, apply a last transformation of the virtual DOM returned by `vdomMap` before being actually set as
     * child. Useful to factorize some transformations.
     *
     * @param domValue value of the attribute returned by `vdomMap`.
     */
    wrapper?: (domValue: TVdomMap) => TVdomFinal

    /**
     * Provide a handle to execute side effects. This is executed just after the new child has been updated
     * in the (real) DOM.
     * @param element the inserted child along with the domain data that was originally
     * emitted by `source$`.
     */
    sideEffects?: (
        element: ResolvedHTMLElement<TDomain, TVdomFinal['tag']>,
    ) => void
}

/**
 * Full specification of reactive children.
 *
 * Example regarding the different policies can be found in the following documentations:
 * *  **replace**: {@link ChildrenOptionsReplace}
 * *  **append**: {@link ChildrenOptionsAppend}
 * *  **sync**: {@link ChildrenOptionsSync}
 *
 * @template Policy policy to be used, either `replace`, `append` or `sync`, see {@link ChildrenPolicy}.
 * @template TDomain type of the domain data (conveys by the `source$` observable).
 */
export type RxChildren<Policy extends ChildrenPolicy, TDomain = unknown> = {
    policy: Policy
} & ChildrenTypesOptionMap<TDomain>[Policy]

/**
 * Mapping between the possible tag name as defined in `HTMLElementTagNameMap` and the associated {@link VirtualDOM}.
 */
export type VirtualDOMTagNameMap = {
    [Property in SupportedTags]: VirtualDOM<Property>
}
