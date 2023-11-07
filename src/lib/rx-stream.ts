import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { render } from './core'
import {
    AnyVirtualDOM,
    ChildrenOptionsAppend,
    ChildrenOptionsSync,
    RenderingUpdate,
    ResolvedHTMLElement,
    RxElementTrait,
} from './api'

/**
 * A RxJs observable that represents a DOM's attribute or child. Also serves as base class for children.
 *
 * @param TDomain the domain data type
 * @param TDom the DOM data type: either :
 *     - {@link AttributeType} for attributes
 *     - {@link VirtualDOM} for child
 *     - list of {@link VirtualDOM}> for children
 *
 * @category Advanced
 */
export class RxStream<TDomain, TDom = TDomain> {
    ClassType = 'Stream$'

    public readonly untilFirst: TDom
    public readonly wrapper: (tDom: TDom) => TDom
    public readonly sideEffects: (element: ResolvedHTMLElement<TDomain>) => void

    /**
     * @param source$  domain's data stream defined as a RxJS observable
     * @param vDomMap mapping
     * @param vDomMap function that convert the domain's data to a vDOM attribute
     * @param untilFirst is the data that will be used until the first emitted element in *stream$* is obtained.
     *  If not provided, the attribute/child does not exist until first emission.
     * @param wrapper is a function that is used to alter the data returned by *vDomMap*.
     * @param sideEffects is a function that provides a handle to execute side effects once the
     * attribute/child as been set/added; both the domain's data and the rendered HTMLElement are provided to this function.
     */
    constructor(
        public readonly source$: Observable<TDomain>,
        public readonly vDomMap: (tDomain: TDomain, ...args) => TDom,
        {
            untilFirst,
            wrapper,
            sideEffects,
        }: {
            untilFirst?: TDom
            wrapper?: (tDom: TDom) => TDom
            sideEffects?: (element: ResolvedHTMLElement<TDomain>) => void
        },
    ) {
        this.untilFirst = untilFirst
        this.wrapper = wrapper
        this.sideEffects = sideEffects
    }

    /**
     * Implementation function that supposed to be called only by {@link RxElementTrait}.
     */
    subscribe(
        realizeDom: (tDom: TDom, ...args) => RxElementTrait,
        ...withData
    ) {
        const mappedSource$: Observable<[TDom, TDomain]> = this.source$.pipe(
            map((d: TDomain) => [this.vDomMap(d, ...withData), d]),
        )

        this.untilFirst && this.finalize(realizeDom, this.untilFirst, undefined)

        return mappedSource$.subscribe(([v, d]: [TDom, TDomain]) => {
            this.finalize(realizeDom, v, d)
        })
    }

    private finalize(
        realizeDom: (tDom: TDom, ...args) => RxElementTrait,
        value: TDom,
        d: TDomain,
    ) {
        const vWrapped = this.wrapper ? this.wrapper(value) : value
        const element = realizeDom(vWrapped)
        this.sideEffects?.({ element, domainData: d })
    }
}

export function instanceOfStream<TDomain, TDom = TDomain>(
    obj: unknown,
): obj is RxStream<TDomain, TDom> {
    return obj && (obj as RxStream<TDomain, TDom>).ClassType === 'Stream$'
}

/**
 * Base class used to define advanced **children** policy in {@link VirtualDOM} when
 * the source stream emit **array** of domain data.
 *
 * You can derive you own class by providing the implementation of {@link update}.
 *
 * Example of use: {@link RxStreamAppend}, {@link RxStreamSync}.
 *
 * @category Advanced
 */
export abstract class RxStreamChildren<TDomain> {
    ClassType = 'ChildrenStream$'
    /**
     * Callback that gets called when the DOM has been updated.
     * @param parent parent: parent {@link RxElementTrait}
     * @param update update: description of the update, see {@link RenderingUpdate}
     */
    public readonly sideEffects: (
        parent: RxElementTrait,
        update: RenderingUpdate<TDomain>,
    ) => void

    protected readonly orderOperator: (d1: TDomain, d2: TDomain) => number
    private readonly children: ResolvedHTMLElement<TDomain>[] = []

    /**
     *
     * @param stream$ input stream
     * @param vDomMap mapping function domain data => {@link VirtualDOM}
     * @param sideEffects see {@link sideEffects}
     * @param orderingFunction see {@link orderOperator}
     */
    protected constructor(
        public readonly stream$: Observable<TDomain[]>,
        public readonly vDomMap: (tDomain: TDomain, ...args) => AnyVirtualDOM,
        {
            sideEffects,
            orderOperator,
        }: Omit<ChildrenOptionsAppend<TDomain>, 'source$' | 'vdomMap'>,
    ) {
        this.vDomMap = vDomMap
        this.sideEffects = sideEffects
        if (orderOperator) {
            this.orderOperator = orderOperator
        } else {
            this.orderOperator = undefined
        }
    }

    protected abstract update(
        parentElement: RxElementTrait,
        domainData: Array<TDomain>,
    ): RenderingUpdate<TDomain>

    /**
     * Only for internal use (within {@link RxElementTrait}), should not actually be exposed.
     */
    subscribe(parentElement: RxElementTrait) {
        return this.stream$
            .pipe(
                map((domains: TDomain[]) => {
                    return this.update(parentElement, domains)
                }),
            )
            .subscribe((updates) => this.sideEffects?.(parentElement, updates))
    }

    protected addChildRef(
        parentElement: RxElementTrait,
        ref: ResolvedHTMLElement<TDomain>,
    ) {
        this.children.push(ref)
        parentElement.appendChild(ref.element)
        this.reorder(parentElement)
    }

    protected removeChildRef(ref: ResolvedHTMLElement<TDomain>) {
        this.children.splice(this.children.indexOf(ref), 1)
        ref.element.remove()
    }

    protected reorder(parentElement: RxElementTrait) {
        if (!this.orderOperator) {
            return
        }
        const parentStyle = window.getComputedStyle(parentElement)
        const display = parentStyle.getPropertyValue('display')
        if (display !== 'flex' && display !== 'grid') {
            console.error(
                'To enable dynamic re-ordering of elements in flux-view, parent element should have the css property ' +
                    "'display' set to 'flex' or 'grid'.",
                parentElement,
            )
        }
        // We don't sort in place: we want the VirtualDom children to be aligned with the real ones.
        // Ordering just affects the display property 'order'.
        const sorted = new Array(...this.children)
            .sort((a, b) => this.orderOperator(a.domainData, b.domainData))
            .map(({ element }) => element as HTMLElement)

        new Array(...parentElement.children).forEach(
            (elem: HTMLElement) =>
                (elem.style.order = `${sorted.indexOf(elem)}`),
        )
    }
}

export function instanceOfChildrenStream<T>(
    obj: unknown,
): obj is RxStreamChildren<T> {
    return obj && (obj as RxStreamChildren<T>).ClassType === 'ChildrenStream$'
}

export class RxStreamAppend<TDomain> extends RxStreamChildren<TDomain> {
    constructor(
        public readonly stream$: Observable<TDomain[]>,
        public readonly vDomMap: (tDomain: TDomain, ...args) => AnyVirtualDOM,
        options: Omit<ChildrenOptionsAppend<TDomain>, 'source$' | 'vdomMap'>,
    ) {
        super(stream$, vDomMap, options)
    }

    protected update(
        parentElement: RxElementTrait,
        domainData: TDomain[],
    ): RenderingUpdate<TDomain> {
        const added = domainData.map((d) => {
            const vDom = this.vDomMap(d)
            return {
                domainData: d,
                virtualDOM: vDom,
                element: render(vDom),
            }
        })
        added.forEach((ref) => this.addChildRef(parentElement, ref))

        return { added, updated: [], removed: [] }
    }
}

export class RxStreamSync<TDomain> extends RxStreamChildren<TDomain> {
    /**
     * Comparison operator used to identify which elements need to be added/ updated/ replaced.
     * By default, reference equality is used, ideal when the domain data are immutables.
     */
    public readonly comparisonOperator: (rhs: TDomain, lhs: TDomain) => boolean

    constructor(
        public readonly stream$: Observable<TDomain[]>,
        public readonly vDomMap: (tDomain: TDomain, ...args) => AnyVirtualDOM,
        options: Omit<ChildrenOptionsSync<TDomain>, 'source$' | 'vdomMap'>,
    ) {
        super(stream$, vDomMap, options)
        if (options.comparisonOperator) {
            this.comparisonOperator = options.comparisonOperator
        } else {
            this.comparisonOperator = (d1, d2) => d1 === d2
        }
    }

    private actualElements: ResolvedHTMLElement<TDomain>[] = []

    protected update(
        parentElement: RxElementTrait,
        expectedData: Array<TDomain>,
    ): RenderingUpdate<TDomain> {
        const actualData = this.actualElements.map(
            (refElem) => refElem.domainData,
        )

        const newData = expectedData.filter((candidate) =>
            this.isNotInList(actualData, candidate),
        )
        const newVirtualDOMs = newData.map((d) => this.vDomMap(d))
        const rendered = newVirtualDOMs.map((vDOM) => render(vDOM))
        const addedRefElem = newData.map((d, i) => ({
            domainData: d,
            virtualDOM: newVirtualDOMs[i],
            element: rendered[i],
        }))
        addedRefElem.forEach((ref) => this.addChildRef(parentElement, ref))

        const deletedRefElem = this.actualElements.filter((candidate) =>
            this.isNotInList(expectedData, candidate.domainData),
        )
        deletedRefElem.forEach((ref) => this.removeChildRef(ref))
        const deletedData = deletedRefElem.map((ref) => ref.domainData)

        if (addedRefElem.length === 0 && deletedRefElem.length === 0) {
            // it may be the case that just the order as changed
            this.reorder(parentElement)
        }
        this.actualElements = [
            ...this.actualElements.filter((candidate) =>
                this.isNotInList(deletedData, candidate.domainData),
            ),
            ...addedRefElem,
        ]

        return { added: addedRefElem, updated: [], removed: deletedRefElem }
    }

    private isNotInList(list: TDomain[], candidate: TDomain): boolean {
        return (
            list.find((item) => this.comparisonOperator(item, candidate)) ===
            undefined
        )
    }
}

/**
 * Type alias for attributes in {@link VirtualDOM}.
 *
 * @category Reactive Attribute
 */
export type AttributeType =
    | number
    | string
    | boolean
    | { [key: string]: number | string | boolean }
