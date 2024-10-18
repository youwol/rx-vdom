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
} from './api'
import { factory, SupportedHTMLTags, TypeCheck } from './factory'
/**
 * Represents a Virtual DOM element that mirrors the structure and characteristics of an HTML DOM element.
 * It allows attributes and children to be supplied reactively via the concept of **observable** (from reactive programming).
 *
 * @template Tag The tag name of the DOM element.
 */
export type VirtualDOM<Tag extends SupportedHTMLTags> = {
    /**
     * The tag of the element, equivalent to the `tagName` property of `HTMLElement`.
     */
    tag: Tag

    /**
     * The class associated with the element, equivalent to the `className` property of `HTMLElement`.
     */
    class?: AttributeLike<string>

    /**
     * The style associated with the element. Typically for a static value:
     * ```typescript
     * {
     *      tag: 'div',
     *      style: {
     *          backgroundColor: 'blue'
     *      }
     * }
     * ```
     * For more details on hyphenated properties, see {@link CSSAttribute}.
     */
    style?: AttributeLike<CSSAttribute>

    /**
     * Additional custom attributes for the element.
     * For example, the attributes 'aria-label' and 'aria-expanded' in the following:
     * ```html
     * <button aria-label="Close" aria-expanded="false"></button>
     * ```
     * would be represented in the virtual DOM as:
     * ```typescript
     * {
     *      tag: 'button',
     *      customAttributes: {
     *          ariaLabel: 'Close',
     *          ariaExpanded: false
     *      }
     * }
     * ```
     * For more details on hyphenated properties, see {@link CustomAttribute}.
     */
    customAttributes?: AttributeLike<CustomAttribute>

    /**
     * Children of the element.
     */
    children?: ChildrenLike

    /**
     * Lifecycle hook called just after the element has been attached to the document's DOM.
     *
     * @param element A reference to the attached HTML element.
     */
    connectedCallback?: (element: RxHTMLElement<Tag>) => void

    /**
     * Lifecycle hook called just after the element has been detached from the document's DOM.
     *
     * @param element A reference to the detached HTML element.
     */
    disconnectedCallback?: (element: RxHTMLElement<Tag>) => void
} & (TypeCheck extends 'none'
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Index signature effectively optional if `TypeCheck` is disabled
      { [k: string]: any }
    : Partial<ExposedMembers<NativeHTMLElement<Tag>>>)

/**
 * Represents the actual HTMLElement rendered from a {@link VirtualDOM}.
 * It implements the standard HTMLElement API for the corresponding tag,
 * enhanced with the {@link RxElementTrait | reactive trait}.
 *
 * @template Tag The tag name of the DOM element.
 */
export type RxHTMLElement<Tag extends SupportedHTMLTags> = RxElementTrait &
    NativeHTMLElement<Tag>

/**
 * Transforms a {@link VirtualDOM} into a corresponding {@link RxHTMLElement}.
 *
 * > The HTML element returned is initialized **only when attached** to the document's DOM tree.
 *
 * @param vDom The virtual DOM to render.
 * @returns The corresponding DOM element.
 */
export function render<Tag extends SupportedHTMLTags>(
    vDom: VirtualDOM<Tag>,
): RxHTMLElement<Tag> {
    if (vDom == undefined) {
        console.error('Got an undefined virtual DOM, return empty div')
        return undefined
    }
    const tag = vDom['tag'] || ('div' as const)

    const element: RxHTMLElement<Tag> = factory<Tag>(tag as unknown as Tag)
    // why 'never', could have been 'any' but my IDE suggest never is better :/
    // The problem is that somehow the signature of the method 'initializeVirtualDom' is doubled:
    //  {(vDom: VirtualDOM<Tag>): void, (vDom: VirtualDOM<SupportedTags>): void}
    // I don't get why.
    element.initializeVirtualDom(vDom as never)
    return element
}
