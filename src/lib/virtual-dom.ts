import {
    AttributeLike,
    ChildrenLike,
    ExposedMembers,
    RxElementTrait,
} from './types'
import { SupportedTags } from './factory'

/**
 * VirtualDOM mirrors the characteristics and structure of an HTML DOM element with the ability
 * for its attributes and children to be supplied through RxJS observables.
 *
 * This introduction of observable-based values into the DOM opens up powerful opportunities for expressing reactivity.
 * Moreover, when compared to other frameworks like Angular and React, there is an efficiency advantage because updates
 * are explicit, eliminating the need for time-consuming calculations of differences and change detection.
 *
 * Virtual DOMs can be transformed into actual HTML elements using the {@link render} function.
 *
 * The representation of Virtual DOMs is in the form of JavaScript objects that closely resemble the HTML format:
 * *  They exhibit a hierarchical structure.
 * *  Each element type is defined by its HTML tag.
 * *  They expose almost identical attributes for a given tag.
 * The mapping between the original attributes of an HTMLElement and those presented in the virtual DOM is determined
 * by {@link ExposedMembers}.
 * *  They introduce additional lifecycle hooks.
 *
 * > The definition of a virtual DOM doesn't mandate the use of the `@youwol/rx-vdom` library.
 * Only libraries responsible for rendering virtual DOMs require the `@youwol/rx-vdom` dependency.
 *
 * A significant focus has been placed on delivering comprehensive type checking for virtual DOM elements
 *  in alignment with their corresponding HTMLElements.
 *  It results in an enhanced development environment when using typescript, e.g.:
 * * DOM's attributes awareness
 *
 * ![image](/api/assets-gateway/raw/package/QHlvdXdvbC9yeC12ZG9t/0.1.0-wip/assets/error-<b>-no-href.png)
 *
 * * DOM's attributes type checking & inlined help
 *
 * ![image](/api/assets-gateway/raw/package/QHlvdXdvbC9yeC12ZG9t/0.1.0-wip/assets/error-wrong-type.png)
 *
 *
 * @template Tag the `tag` of the DOM element.
 */
export type VirtualDOM<Tag extends SupportedTags> = {
    /**
     * The tag of the element, corresponds to the template parameter `Tag`.
     */
    tag?: Tag

    /**
     * The class associated to the element, equivalent of the `className` attribute of `HTMLElement`.
     */
    class?: AttributeLike<string>

    /**
     * The style associated to the element.
     */
    style?: AttributeLike<{ [k: string]: string }>

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
 * It implements the regular HTMLElement API of corresponding tag on top of which reactive trait is added.
 *
 */
export type RxHTMLElement<Tag extends SupportedTags> = RxElementTrait &
    HTMLElementTagNameMap[Tag]
