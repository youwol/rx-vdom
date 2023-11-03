import { RxHTMLElement } from './core'
import { AttributeLike, ChildrenLike, ExposedMembers } from './types'

/**
 * # In a nutshell
 *
 *  VirtualDOM captures the same properties and organization than an HTML DOM element with the differences that
 *  attributes and children can be provided in multiple forms, in particular using RxJS observables.
 *
 *  Bringing observable based values within the DOM enables powerful options to express reactivity.
 *  Also, compared to other framework (e.g. Angular, React), there is a gain in efficiency because
 *  updates are explicit and there is no need to spend time in calculating diff and/or detecting changes.
 *
 *  Virtual DOMs can be converted into 'real' {@link RxHTMLElement | HTML elements} using the function {@link render}.
 *
 *  Virtual DOM are expressed as javascript object that mimics the HTML format:
 *  *  hierarchical structure
 *  *  each element type is defined by its **tag**
 *  *  expose (almost) the same attributes for the given **tag**.
 *  The mapping between the original properties of a given HTMLElement and those exposed in the virtual DOM is defined
 *  by {@link ExposedMembers}.
 *  *  add additional lifecycle hooks
 *
 *
 *
 *
 * # Why moving from flux-view:
 * ## Strong type checking
 * ### DOM's attributes awareness
 *
 * ![image](/api/assets-gateway/raw/package/QHlvdXdvbC9yeC12ZG9t/0.1.0-wip/assets/error-<b>-no-href.png)
 *
 * ### DOM's attributes type checking & inlined help
 *
 * ![image](/api/assets-gateway/raw/package/QHlvdXdvbC9yeC12ZG9t/0.1.0-wip/assets/error-wrong-type.png)
 *
 * ## VirtualDOM definition does not need `@youwol/rx-vdom`
 *
 * ## Move to `rxjs#7.x`
 *
 *
 *
 * @template Tag the `tag` of the DOM element. See typescript interface `HTMLElementTagNameMap` in `l.dom.ts` or
 * [here](https://developer.mozilla.org/en-US/docs/Web/HTML/Element).
 */
export type VirtualDOM<Tag extends keyof HTMLElementTagNameMap = 'div'> = {
    /**
     * The tag of the element, corresponds to the template parameter Tag
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
     *
     * @param element
     */
    connectedCallback?: (element: RxHTMLElement<Tag>) => void

    disconnectedCallback?: (element: RxHTMLElement<Tag>) => void
} & Partial<ExposedMembers<Tag>>
