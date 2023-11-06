import { Observable, Subscription } from 'rxjs'
import { CustomElementsMap, SupportedTags } from './factory'
import {
    AttributeType,
    instanceOfStream,
    RxStream,
    instanceOfChildrenStream,
    RxStreamAppend,
    RxStreamSync,
} from './rx-stream'
import { VirtualDOM, RxHTMLElement } from './virtual-dom'
import {
    AnyVirtualDOM,
    AttributeLike,
    ChildLike,
    ChildrenPolicy,
    RxAttribute,
    RxChild,
    RxChildren,
    RxElementTrait,
} from './types'
import { setup } from '../auto-generated'

const customElementPrefix = `${setup.name.split('/')[1]}-${setup.apiVersion}`

class HTMLPlaceHolderElement extends HTMLElement {
    private currentElement: HTMLElement

    initialize(stream$: RxStream<VirtualDOM>): Subscription {
        this.currentElement = this

        const apply = (vDom: VirtualDOM): RxElementTrait => {
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
        return stream$.subscribe((vDom: VirtualDOM) => apply(vDom))
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
function isInstanceOfRxAttribute(d: unknown): d is RxAttribute<unknown> {
    return d && (d as RxAttribute<unknown>).source$ !== undefined
}
function isInstanceOfRxChild(d: unknown): d is RxChild<unknown> {
    return d && (d as RxChild<unknown>).source$ !== undefined
}
function isInstanceOfRxChildren(
    d: unknown,
): d is RxChildren<ChildrenPolicy, unknown> {
    return d && (d as RxChildren<ChildrenPolicy, unknown>).source$ !== undefined
}
function extractRxStreams<Tag extends SupportedTags>(
    vDom: Readonly<VirtualDOM<Tag>>,
): {
    attributes: [string, AttributeType | RxStream<unknown>][]
    children:
        | (AnyVirtualDOM | HTMLElement | RxStream<unknown, VirtualDOM>)[]
        | RxStream<unknown, VirtualDOM[]>
        | RxStreamAppend<unknown>
        | RxStreamSync<unknown>
} {
    const allAttributes = Object.entries(vDom).filter(
        ([k, _]) =>
            k !== 'children' &&
            k !== 'connectedCallback' &&
            k !== 'disconnectedCallback',
    )

    const attributes = allAttributes.map(
        (attribute: AttributeLike<unknown>) => {
            if (isInstanceOfObservable(attribute)) {
                return new RxStream(attribute, (d) => d, {})
            }
            if (isInstanceOfRxAttribute(attribute)) {
                return new RxStream(attribute.source$, attribute.vdomMap, {
                    sideEffects: attribute.sideEffects,
                    untilFirst: attribute.untilFirst,
                })
            }
            return attribute
        },
    ) as [string, AttributeType | RxStream<unknown>][]

    if (!vDom.children) {
        return { attributes, children: [] }
    }
    if (Array.isArray(vDom.children)) {
        const children = vDom.children.map((child: ChildLike) => {
            if (isInstanceOfRxChild(child)) {
                return new RxStream(child.source$, child.vdomMap, {
                    sideEffects: child.sideEffects,
                    untilFirst: child.untilFirst,
                })
            }
            return child
        })
        return { attributes, children }
    }
    if (!isInstanceOfRxChildren(vDom.children)) {
        console.warn('Type of children unknown', vDom.children)
        return { attributes, children: [] }
    }
    if (vDom.children.policy === 'replace') {
        const children = new RxStream(
            vDom.children.source$,
            vDom.children.vdomMap,
            {
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
                sideEffects: vDom.children.sideEffects,
                orderOperator: vDom.children.orderOperator,
            },
        )
        return { attributes, children }
    }
    console.warn('Unknown RxChildren policy', vDom.children)
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
            if (!this.vDom) {
                return
            }
            const { attributes, children } = extractRxStreams<Tag>(this.vDom)

            attributes
                .filter(([_, v]) => !instanceOfStream(v))
                .forEach(([k, v]: [k: string, v: AttributeType]) => {
                    this.applyAttribute(k, v)
                })

            attributes
                .filter(([_, v]) => instanceOfStream(v))
                .forEach(
                    ([k, attr$]: [
                        k: string,
                        attr$: RxStream<AttributeType>,
                    ]) => {
                        this.subscriptions.push(
                            attr$.subscribe((v: AttributeType) => {
                                this.applyAttribute(k, v)
                                return this as unknown as RxHTMLElement<Tag>
                            }, this),
                        )
                    },
                )
            if (Array.isArray(children)) {
                this.renderChildren(children)
            }
            if (instanceOfStream<unknown, VirtualDOM[]>(this.vDom.children)) {
                this.subscriptions.push(
                    this.vDom.children.subscribe((children) => {
                        this.replaceChildren()
                        this.renderChildren(children)
                        return this as unknown as RxHTMLElement<Tag>
                    }),
                )
            }

            if (instanceOfChildrenStream(this.vDom.children)) {
                this.subscriptions.push(
                    this.vDom.children.subscribe(
                        this as unknown as RxHTMLElement<Tag>,
                    ),
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
        renderChildren(
            children: (AnyVirtualDOM | RxStream<VirtualDOM> | HTMLElement)[],
        ): Array<RxElementTrait> {
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
                        const div = render(child as VirtualDOM)
                        this.appendChild(div)
                        rendered.push(div)
                    }
                })
            return rendered
        }
        /**
         * @ignore
         */
        applyAttribute(name: string, value: AttributeType) {
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

function factory<Tag extends SupportedTags>(tag: Tag): RxHTMLElement<Tag> {
    if (!CustomElementsMap[tag as string]) {
        throw Error(
            `The element ${tag} is not registered in flux-view's factory`,
        )
    }

    return document.createElement(tag, {
        is: `${customElementPrefix}-${tag}`,
    }) as RxHTMLElement<Tag>
}

/**
 * Transform a {@link VirtualDOM} into a {@link RxHTMLElement}.
 *
 * >  The HTML element returned is initialized **only when attached** to the document's DOM tree.
 *
 * @param vDom the virtual DOM
 * @returns the corresponding DOM element
 */
export function render<Tag extends SupportedTags>(
    vDom: VirtualDOM<Tag>,
): RxHTMLElement<Tag> {
    if (vDom == undefined) {
        console.error('Got an undefined virtual DOM, return empty div')
        return undefined
    }
    const element: RxHTMLElement<Tag> = factory<Tag>(vDom.tag)
    // why 'never', could have been 'any' but my IDE suggest never is better :/
    // The problem is that somehow the signature of the method 'initializeVirtualDom' is doubled:
    //  {(vDom: VirtualDOM<Tag>): void, (vDom: VirtualDOM<SupportedTags>): void}
    // I don't get why.
    element.initializeVirtualDom(vDom as never)
    return element
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
