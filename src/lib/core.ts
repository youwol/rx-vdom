import {
    CustomElementsMap,
    SupportedHTMLTags,
    customElementPrefix,
} from './factory'
import {
    instanceOfStream,
    RxStream,
    instanceOfChildrenStream,
    RxStreamAppend,
    RxStreamSync,
    RxStreamChildren,
} from './rx-stream'
import { VirtualDOM, RxHTMLElement, render } from './virtual-dom'
import {
    AnyVirtualDOM,
    AttributeLike,
    AnyHTMLAttribute,
    ChildLike,
    ChildrenPolicy,
    Observable,
    RxAttribute,
    RxChild,
    RxChildren,
    RxElementTrait,
    Subscription,
} from './api'
import { setup } from '../auto-generated'

class HTMLPlaceHolderElement extends HTMLElement {
    private currentElement: HTMLElement

    initialize(stream$: RxStream<unknown, AnyVirtualDOM>): Subscription {
        this.currentElement = this

        const apply = (vDom: AnyVirtualDOM | undefined): HTMLElement => {
            const div = vDom && render(vDom)
            // Replacing with 'undefined' will remove the child, which is what is expected.
            this.currentElement.replaceWith(div)
            this.currentElement = div
            return div
        }
        return stream$.subscribe(
            (vDom: AnyVirtualDOM) =>
                apply(vDom) as RxHTMLElement<SupportedHTMLTags>,
        )
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TS2545: A mixin class must have a constructor with a single rest parameter of type 'any[]'.
type Constructor<T extends HTMLElement> = new (...args: any[]) => T

const specialBindings = {
    class: (instance, value) => (instance.className = value),
    style: (instance: HTMLElement, value) => {
        Object.entries(value).forEach(([k, v]) => (instance.style[k] = v))
    },
    customAttributes: (instance, value: { [k: string]: string }) => {
        Object.entries(value).forEach(([k, v]) =>
            instance.setAttribute(k.replace(/[A-Z]/g, '-$&').toLowerCase(), v),
        )
    },
}

function isInstanceOfObservable(d: unknown): d is Observable<unknown> {
    return d && (d as Observable<unknown>).subscribe !== undefined
}
function isInstanceOfRxAttribute(d: unknown): d is RxAttribute {
    return d && (d as RxAttribute).source$ !== undefined
}
function isInstanceOfRxChild(d: unknown): d is RxChild {
    return d && (d as RxChild).source$ !== undefined
}
function isInstanceOfRxChildren(
    d: unknown,
): d is RxChildren<ChildrenPolicy, unknown> {
    return d && (d as RxChildren<ChildrenPolicy, unknown>).source$ !== undefined
}

type ConvertedAttributeLike =
    | AnyHTMLAttribute
    | RxStream<unknown, AnyHTMLAttribute>

type ConvertedChildLike =
    | AnyVirtualDOM
    | HTMLElement
    | RxStream<unknown, AnyVirtualDOM>

function extractRxStreams<Tag extends SupportedHTMLTags>(
    vDom: Readonly<VirtualDOM<Tag>>,
): {
    attributes: [string, ConvertedAttributeLike][]
    children:
        | ConvertedChildLike[]
        | RxStream<unknown, AnyVirtualDOM[]>
        | RxStreamChildren<unknown>
} {
    const allAttributes = Object.entries(vDom).filter(
        ([k, _]) =>
            k !== 'tag' &&
            k !== 'children' &&
            k !== 'connectedCallback' &&
            k !== 'disconnectedCallback',
    )

    const attributes: [string, ConvertedAttributeLike][] = allAttributes.map(
        ([k, attribute]: [string, AttributeLike<AnyHTMLAttribute>]) => {
            if (instanceOfStream(attribute)) {
                // This is when the method 'child$' of '@youwol/flux-view' is used
                return [k, attribute as RxStream<unknown, AnyHTMLAttribute>]
            }
            if (isInstanceOfObservable(attribute)) {
                return [
                    k,
                    new RxStream<AnyHTMLAttribute, AnyHTMLAttribute>(
                        attribute,
                        (d) => d,
                        {},
                    ),
                ]
            }
            if (isInstanceOfRxAttribute(attribute)) {
                return [
                    k,
                    new RxStream<unknown, AnyHTMLAttribute>(
                        attribute.source$,
                        attribute.vdomMap,
                        {
                            wrapper: attribute.wrapper,
                            sideEffects: attribute.sideEffects,
                            untilFirst: attribute.untilFirst,
                        },
                    ),
                ]
            }
            return [k, attribute]
        },
    )

    if (!vDom.children) {
        return { attributes, children: [] }
    }
    if (Array.isArray(vDom.children)) {
        const children = vDom.children.map((child: ChildLike) => {
            if (instanceOfStream(child)) {
                // This is when the method 'child$' of '@youwol/flux-view' is used
                return child as RxStream<unknown, AnyVirtualDOM>
            }
            if (isInstanceOfRxChild(child)) {
                return new RxStream<unknown, AnyVirtualDOM>(
                    child.source$,
                    child.vdomMap,
                    {
                        wrapper: child.wrapper,
                        sideEffects: child.sideEffects,
                        untilFirst: child.untilFirst,
                    },
                )
            }
            return child
        })
        return { attributes, children }
    }
    if (instanceOfStream(vDom.children)) {
        // This is when the method 'children$' of '@youwol/flux-view' is used
        return {
            attributes,
            children: vDom.children as RxStream<unknown, AnyVirtualDOM[]>,
        }
    }
    if (instanceOfChildrenStream(vDom.children)) {
        // This is when the method 'childrenAppendOnly$' or `childrenFromStore` of '@youwol/flux-view' are used
        return {
            attributes,
            children: vDom.children as RxStreamChildren<unknown>,
        }
    }
    if (!isInstanceOfRxChildren(vDom.children)) {
        console.error('Type of children unknown', vDom.children)
        return { attributes, children: [] }
    }
    if (vDom.children.policy === 'replace') {
        const children = new RxStream(
            vDom.children.source$,
            vDom.children.vdomMap,
            {
                wrapper: vDom.children.wrapper,
                sideEffects: vDom.children.sideEffects,
                untilFirst: vDom.children.untilFirst,
            },
        )
        return { attributes, children }
    }
    if (vDom.children.policy === 'append') {
        const children = new RxStreamAppend(
            vDom.children.source$,
            vDom.children.vdomMap,
            {
                sideEffects: vDom.children.sideEffects,
                orderOperator: vDom.children.orderOperator,
            },
        )
        return { attributes, children }
    }
    if (vDom.children.policy === 'sync') {
        const children = new RxStreamSync(
            vDom.children.source$,
            vDom.children.vdomMap,
            {
                comparisonOperator: vDom.children.comparisonOperator,
                sideEffects: vDom.children.sideEffects,
                orderOperator: vDom.children.orderOperator,
            },
        )
        return { attributes, children }
    }
    console.error('Unknown RxChildren policy', vDom.children)
    return { attributes, children: [] }
}

/**
 * Transforms a regular `HTMLElement` into a reactive one by augmenting it with reactive capabilities.
 * This allows you to manage the lifecycle of subscriptions and provides additional hooks for DOM events,
 * such as when the element is added or removed from the page.
 *
 * The reactive enhancements include:
 * - `vDom: Readonly<VirtualDOM<Tag>>`: Represents the associated Virtual DOM.
 * - `ownSubscriptions(...subs: Subscription[]): void`: Enables you to attach RxJS subscriptions to the element.
 * These subscriptions will be automatically unsubscribed (last in, first out) when the element is removed from the page.
 * - `hookOnDisconnected(...callbacks: (() => void)[]): void`: Registers callback functions to be executed when the
 * element is removed from the DOM. Callbacks are executed in the reversed order of registration.
 *
 * The returned class extends the provided base `HTMLElement` constructor and adds the reactive functionality
 * described above.
 *
 * @param Base The base constructor of the regular HTMLElement.
 * @returns A class that extends the provided `Base` constructor and adds reactive functionality to it.
 * @template T The type of the constructor of the regular HTMLElement.
 * @template Tag The associated HTML tag.
 */
export function ReactiveTrait<
    T extends Constructor<HTMLElement>,
    Tag extends SupportedHTMLTags,
>(Base: T) {
    return class extends Base {
        /**
         * Virtual DOM
         */
        vDom: Readonly<VirtualDOM<Tag>>

        /**
         * @ignore
         */
        subscriptions = new Array<Subscription>()

        /**
         * @ignore
         */
        disconnectionHooks: (() => void)[] = []

        /**
         * @ignore
         */
        initializeVirtualDom(vDom: VirtualDOM<Tag>) {
            this.vDom = vDom
        }
        /**
         * @ignore
         */
        connectedCallback() {
            const { attributes, children } = extractRxStreams<Tag>(this.vDom)

            attributes
                .filter(([_, v]) => !instanceOfStream(v))
                .forEach(([k, v]: [k: string, v: AnyHTMLAttribute]) => {
                    this.applyAttribute(k, v)
                })

            attributes
                .filter(([_, v]) => instanceOfStream(v))
                .forEach(
                    ([k, attr$]: [
                        k: string,
                        attr$: RxStream<AnyHTMLAttribute>,
                    ]) => {
                        this.subscriptions.push(
                            attr$.subscribe((v: AnyHTMLAttribute) => {
                                this.applyAttribute(k, v)
                                return this as unknown as RxHTMLElement<Tag>
                            }, this),
                        )
                    },
                )
            if (Array.isArray(children)) {
                this.renderChildren(children)
            }
            if (instanceOfStream<unknown, AnyVirtualDOM[]>(children)) {
                this.subscriptions.push(
                    children.subscribe((children) => {
                        this.replaceChildren()
                        this.renderChildren(children)
                        return this as unknown as RxHTMLElement<Tag>
                    }),
                )
            }

            if (instanceOfChildrenStream(children)) {
                this.subscriptions.push(
                    children.subscribe(this as unknown as RxHTMLElement<Tag>),
                )
            }
            this.vDom?.connectedCallback?.(
                this as unknown as RxHTMLElement<Tag>,
            )
        }

        /**
         * @ignore
         */
        disconnectedCallback() {
            this.subscriptions.reverse().forEach((s) => s.unsubscribe())
            this.disconnectionHooks.reverse().forEach((cb) => cb())
            this.vDom?.disconnectedCallback?.(
                this as unknown as RxHTMLElement<Tag>,
            )
        }

        /**
         * @ignore
         */
        renderChildren(children: ConvertedChildLike[]): Array<RxElementTrait> {
            const rendered = []
            children
                .filter((child) => child != undefined)
                .forEach((child) => {
                    if (instanceOfStream(child)) {
                        const placeHolder = document.createElement(
                            `${customElementPrefix}-placeholder`,
                        ) as HTMLPlaceHolderElement
                        this.appendChild(placeHolder)
                        this.subscriptions.push(placeHolder.initialize(child))
                        rendered.push(placeHolder)
                    } else if (child instanceof HTMLElement) {
                        this.appendChild(child)
                    } else {
                        const div = render(child)
                        this.appendChild(div)
                        rendered.push(div)
                    }
                })
            return rendered
        }
        /**
         * @ignore
         */
        applyAttribute(name: string, value: AnyHTMLAttribute) {
            const binding = specialBindings[name]
                ? () => specialBindings[name](this, value)
                : () => (this[name] = value)
            binding()
        }

        /**
         * Adds subscriptions to the element, marking them as "owned" by it.
         *
         * When the element is removed from the DOM, all owned subscriptions are automatically unsubscribed.
         *
         * The resource cleanup process upon element disconnection follows these steps:
         * 1. Unsubscribe all subscriptions registered via `ownSubscriptions`, in reverse order (LIFO).
         * 2. Execute any hooks registered via `hookOnDisconnected`, in reverse order (LIFO).
         * 3. Finally, invoke the optional `disconnectedCallback` defined in the associated {@link VirtualDOM},
         * if present.
         *
         * @param subs - The subscriptions to be owned by this element. They will be unsubscribed upon disconnection.
         */
        ownSubscriptions(...subs: Subscription[]) {
            this.subscriptions.push(...subs)
        }

        /**
         * Registers callbacks to be invoked when the element is disconnected from the DOM.
         *
         * These callbacks are executed after the element's owned subscriptions (registered via `ownSubscriptions`)
         * have been unsubscribed, but before invoking the optional `disconnectedCallback` provided in the
         * {@link VirtualDOM}.
         *
         * The callbacks are executed in reverse order of registration (last in, first out), ensuring that
         * any resources or actions dependent on the order of registration are cleaned up correctly.
         *
         * This method is useful for performing additional resource cleanup or other actions when the element is
         * removed from the DOM.
         *
         * @param callbacks - The functions to be executed when the element is disconnected from the DOM.
         */
        hookOnDisconnected(...callbacks: (() => void)[]) {
            this.disconnectionHooks.push(...callbacks)
        }
    }
}

function registerElement<Tag extends SupportedHTMLTags>(
    tag: Tag,
    BaseClass: typeof HTMLElement,
) {
    class ExtendedClass extends ReactiveTrait<typeof BaseClass, Tag>(
        BaseClass,
    ) {}
    customElements.define(
        `${customElementPrefix}-${tag}`,
        ExtendedClass as CustomElementConstructor,
        { extends: tag },
    )
}

export function register() {
    if (customElements.get(`${customElementPrefix}-placeholder`)) {
        console.warn(
            `@youwol/rx-vdom with api version ${setup.apiVersion} has already defined custom elements`,
        )
        return
    }

    customElements.define(
        `${customElementPrefix}-placeholder`,
        HTMLPlaceHolderElement,
    )

    Object.entries(CustomElementsMap).forEach(
        ([tag, HTMLElementClass]: [
            tag: SupportedHTMLTags,
            typeof HTMLElement,
        ]) => {
            HTMLElementClass && registerElement(tag, HTMLElementClass)
        },
    )
}

register()
