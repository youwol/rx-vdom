import {
    AttributeLike,
    ChildrenLike,
    ExposedMembers,
    RxElementTrait,
    // eslint-disable-next-line unused-imports/no-unused-imports -- used for documentation
    Observable,
    // eslint-disable-next-line unused-imports/no-unused-imports -- used for documentation
    Subscription,
    CustomAttribute,
    CSSAttribute,
    NativeHTMLElement,
    FluxViewVirtualDOM,
} from './api'
import { factory, SupportedTags } from './factory'
/**
 * # Introduction
 *
 * VirtualDOM mirrors the characteristics and structure of an HTML DOM element with the ability
 * for its attributes and children to be supplied through the concept of **observable** (from reactive programing).
 *
 * > The library has been originally designed to be supported by the reactive programming primitives provided by
 * [RxJS](https://rxjs.dev/). Others solutions can be used as long as the required {@link Observable} &
 * {@link Subscription} interfaces' implementation are provided.
 *
 * Virtual DOMs can be transformed into actual HTML elements using the {@link render} function.
 *
 * A typical example is as follows:
 *
 * <iframe id="iFrameExample_VirtualDOM" src="" width="100%" height="500px"></iframe>
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
 *          innerText: rxjs.timer(0, 1000).pipe(
 *              rxjs.map(() => new Date().toLocaleString())
 *          ),
 *      };
 *      document.getElementById('content').appendChild(rxDom.render(vDOM));
 *   </script>
 * </html>
 * -->`
 *     const url = '/applications/@youwol/js-playground/latest?content='+encodeURIComponent(src.substring(4,src.length-4))
 *     document.getElementById('iFrameExample_VirtualDOM').setAttribute("src",url);
 * </script>
 *
 * The representation of Virtual DOMs is in the form of JavaScript objects that closely resemble the HTML format:
 * *  They exhibit a hierarchical structure.
 * *  Each element type is defined by its HTML tag.
 * *  They expose almost identical attributes for a given tag.
 * The mapping between the original attributes of an HTMLElement and those presented in the virtual DOM is determined
 * by {@link ExposedMembers}.
 * *  They introduce additional lifecycle hooks.
 *
 * > The definition of a virtual DOM doesn't require the `@youwol/rx-vdom` library.
 * Only libraries responsible for rendering virtual DOMs require the `@youwol/rx-vdom` dependency.
 *
 * # Type safety
 *
 * A significant focus has been placed on delivering comprehensive type checking for virtual DOM elements
 *  in alignment with their corresponding HTMLElements.
 *  It results in an enhanced development environment when using typescript, e.g.:
 * * DOM's attributes awareness
 *
 * ![image](/api/assets-gateway/raw/package/QHlvdXdvbC9yeC12ZG9t/1.0.0-wip/assets/error-<b>-no-href.png)
 *
 * * DOM's attributes type checking & inlined help
 *
 * ![image](/api/assets-gateway/raw/package/QHlvdXdvbC9yeC12ZG9t/1.0.0-wip/assets/error-wrong-type.png)
 *
 *
 * * style's attributes type checking & inlined help
 *
 * ![image](/api/assets-gateway/raw/package/QHlvdXdvbC9yeC12ZG9t/1.0.0-wip/assets/style-wrong-type.png)
 *
 *
 * @template Tag the `tag` of the DOM element.
 */
export type VirtualDOM<Tag extends SupportedTags> = {
    /**
     * The tag of the element, equivalent of the `tagName` attribute of `HTMLElement`.
     */
    tag: Tag

    /**
     * The class associated to the element, equivalent of the `className` attribute of `HTMLElement`.
     */
    class?: AttributeLike<string>

    /**
     * The style associated to the element, typically for a static value:
     * ```
     * {
     *      tag: 'div',
     *      style: {
     *          backgroundColor: 'blue'
     *      }
     * }
     * ```
     * See comment regarding hyphen in properties name in {@link CSSAttribute}.
     */
    style?: AttributeLike<CSSAttribute>

    /**
     * Definition of additional custom attributes.
     * E.g. the attributes 'aria-label' & 'aria-expanded' in the following:
     * ```
     * <button aria-label="Close" aria-expanded="false"></button>
     * ```
     * would be represented in the (static) virtual DOM by:
     * ```
     * {
     *      tag: 'button',
     *      customAttributes: {
     *          ariaLabel: 'Close',
     *          ariaExpanded: false
     *      }
     * }
     * ```
     *
     * See comment regarding hyphen in properties name in {@link CustomAttribute}.
     */
    customAttributes?: AttributeLike<CustomAttribute>

    /**
     * Children of the element.
     */
    children?: ChildrenLike

    /**
     * Lifecycle hook called just after the element has been attached to the window's DOM.
     *
     * @param element reference on the HTML element attached
     */
    connectedCallback?: (element: RxHTMLElement<Tag>) => void

    /**
     * Lifecycle hook called just after the element has been detached to the window's DOM.
     *
     * @param element reference on the HTML element detached
     */
    disconnectedCallback?: (element: RxHTMLElement<Tag>) => void
} & Partial<ExposedMembers<Tag>>

/**
 * The actual HTMLElement rendered from a {@link VirtualDOM}.
 * It implements the regular HTMLElement API of corresponding tag on top of which
 * {@link RxElementTrait | reactive trait} is added.
 *
 */
export type RxHTMLElement<Tag extends SupportedTags> = RxElementTrait &
    NativeHTMLElement<Tag>

/**
 * Transform a {@link VirtualDOM} into a {@link RxHTMLElement}.
 *
 * >  The HTML element returned is initialized **only when attached** to the document's DOM tree.
 *
 * @param vDom the virtual DOM
 * @returns the corresponding DOM element
 */
export function render<Tag extends SupportedTags>(
    vDom: VirtualDOM<Tag> | FluxViewVirtualDOM,
): RxHTMLElement<Tag> {
    if (vDom == undefined) {
        console.error('Got an undefined virtual DOM, return empty div')
        return undefined
    }
    // the next 2 type unsafe lines are to support FluxViewVirtualDOM
    const tag = vDom['tag'] || ('div' as const)

    const element: RxHTMLElement<Tag> = factory<Tag>(tag as unknown as Tag)
    // why 'never', could have been 'any' but my IDE suggest never is better :/
    // The problem is that somehow the signature of the method 'initializeVirtualDom' is doubled:
    //  {(vDom: VirtualDOM<Tag>): void, (vDom: VirtualDOM<SupportedTags>): void}
    // I don't get why.
    element.initializeVirtualDom(vDom as never)
    return element
}
