import {
    CustomElementsMap,
    SupportedTags,
    customElementPrefix,
} from './factory'
import {
    instanceOfStream,
    RxStream,
    instanceOfChildrenStream,
    RxStreamAppend,
    RxStreamSync,
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

        const apply = (vDom: AnyVirtualDOM): RxElementTrait => {
            // if (vDom instanceof HTMLElement) {
            //     this.currentElement.replaceWith(vDom)
            //     this.currentElement = vDom
            //     return vDom
            // }
            const div = render(vDom)
            this.currentElement.replaceWith(div)
            this.currentElement = div
            return div
        }
        return stream$.subscribe((vDom: AnyVirtualDOM) => apply(vDom))
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

function extractRxStreams<Tag extends SupportedTags>(
    vDom: Readonly<VirtualDOM<Tag>>,
): {
    attributes: [string, ConvertedAttributeLike][]
    children:
        | ConvertedChildLike[]
        | RxStream<unknown, AnyVirtualDOM[]>
        | RxStreamAppend<unknown>
        | RxStreamSync<unknown>
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

export function ReactiveTrait<
    T extends Constructor<HTMLElement>,
    Tag extends SupportedTags,
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
            this.subscriptions.forEach((s) => s.unsubscribe())
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
         * The provided subscription get owned by the element:
         * it will be unsubscribed when the element is removed from the DOM.
         * @param subs subscriptions to own
         */
        ownSubscriptions(...subs: Subscription[]) {
            this.subscriptions.push(...subs)
        }
    }
}

function registerElement<Tag extends SupportedTags>(
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

function register() {
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
        ([tag, HTMLElementClass]: [tag: SupportedTags, typeof HTMLElement]) => {
            HTMLElementClass && registerElement(tag, HTMLElementClass)
        },
    )
}

register()
