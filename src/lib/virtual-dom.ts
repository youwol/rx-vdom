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
import { factory, SupportedHTMLTags, TypeCheck } from './factory'
/**
 * VirtualDOM mirrors the characteristics and structure of an HTML DOM element with the ability
 * for its attributes and children to be supplied through the concept of **observable** (from reactive programing).
 *
 *
 * @template Tag the `tag` of the DOM element.
 */
export type VirtualDOM<Tag extends SupportedHTMLTags> = {
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
} & (TypeCheck extends 'none'
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Index signature effectively optional if `TypeCheck` is disabled
      { [k: string]: any }
    : Partial<ExposedMembers<NativeHTMLElement<Tag>>>)

/**
 * The actual HTMLElement rendered from a {@link VirtualDOM}.
 * It implements the regular HTMLElement API of corresponding tag on top of which
 * {@link RxElementTrait | reactive trait} is added.
 *
 */
export type RxHTMLElement<Tag extends SupportedHTMLTags> = RxElementTrait &
    NativeHTMLElement<Tag>

/**
 * Transform a {@link VirtualDOM} into a {@link RxHTMLElement}.
 *
 * >  The HTML element returned is initialized **only when attached** to the document's DOM tree.
 *
 * @param vDom the virtual DOM
 * @returns the corresponding DOM element
 */
export function render<Tag extends SupportedHTMLTags>(
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
