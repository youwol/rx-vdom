import { render, VirtualDOM } from '../lib'
import { orderedChildren } from './utils'
import {
    attr$,
    child$,
    children$,
    childrenAppendOnly$,
    childrenFromStore$,
    VirtualDOM as FvVirtualDOM,
} from '@youwol/flux-view'
import { BehaviorSubject, of, Subject } from 'rxjs'
import { ChildrenLike, FluxViewVirtualDOM } from '../lib/api'

test('with flux-view default div child', () => {
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        children: [{ innerText: 'foo' } as FluxViewVirtualDOM],
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const children = orderedChildren(html)
    expect(children).toHaveLength(1)
    expect(children[0].innerText).toBe('foo')
})

test('with flux-view, attr$', () => {
    const source$ = new Subject<string>()
    const sideEffects = []
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'a',
                innerText: attr$(source$, (text) => text, {
                    wrapper: (d) => `${d} bar`,
                    untilFirst: 'baz',
                    sideEffects: (d) => sideEffects.push(d),
                }),
            } as FluxViewVirtualDOM,
        ],
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const children = orderedChildren(html)
    expect(children).toHaveLength(1)
    expect(children[0].innerText).toBe('baz bar')
    source$.next('foo')
    expect(children[0].innerText).toBe('foo bar')
    expect(sideEffects).toHaveLength(2)
})

test('with flux-view, child$', () => {
    const source$ = new Subject<string>()
    const sideEffects = []
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                fromFluxView: true,
                tag: 'a',
                children: [
                    child$(source$, (text) => ({ innerText: text }), {
                        untilFirst: { innerText: 'baz' },
                        wrapper: (vDom) => {
                            return { ...vDom, class: 'bar' }
                        },
                        sideEffects: (d) => sideEffects.push(d),
                    }),
                ],
            } as FluxViewVirtualDOM,
        ],
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const children = orderedChildren(html)
    expect(children).toHaveLength(1)
    const children1 = orderedChildren(children[0])
    expect(children1[0].innerText).toBe('baz')
    expect(children1[0].className).toBe('bar')
    source$.next('foo')
    const children2 = orderedChildren(children[0])
    expect(children2[0].innerText).toBe('foo')
    expect(children2[0].className).toBe('bar')
    expect(sideEffects).toHaveLength(2)
})

test('with flux-view, children$', () => {
    const source$ = new Subject<string>()
    const sideEffects = []
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                fromFluxView: true,
                tag: 'a',
                children: children$(source$, (text) => [{ innerText: text }], {
                    untilFirst: [{ innerText: 'baz' }],
                    wrapper: (vDom) => {
                        return [{ ...vDom[0], class: 'bar' }]
                    },
                    sideEffects: (d) => sideEffects.push(d),
                }),
            } as FluxViewVirtualDOM,
        ],
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const children = orderedChildren(html)
    expect(children).toHaveLength(1)
    const children1 = orderedChildren(children[0])
    expect(children1[0].innerText).toBe('baz')
    source$.next('foo')
    const children2 = orderedChildren(children[0])
    expect(children2[0].innerText).toBe('foo')
    expect(children2[0].className).toBe('bar')
    expect(sideEffects).toHaveLength(2)
})

test('with flux-view, childrenAppendOnly$', () => {
    const sideEffects = []
    const source$ = new BehaviorSubject<string[]>(['foo bar baz'])
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                fromFluxView: true,
                style: {
                    display: 'flex',
                },
                tag: 'a',
                children: childrenAppendOnly$(
                    source$,
                    (text) => ({
                        innerText: text,
                    }),
                    {
                        orderOperator: (a, b) => a.length - b.length,
                        sideEffects: (d) => sideEffects.push(d),
                    },
                ),
            } as FluxViewVirtualDOM,
        ],
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const children = orderedChildren(html)
    expect(children).toHaveLength(1)
    const children0 = orderedChildren(children[0])
    expect(children0[0].innerText).toBe('foo bar baz')
    source$.next(['foo'])
    const children1 = orderedChildren(children[0])
    expect(children1[0].innerText).toBe('foo')
    expect(children1[1].innerText).toBe('foo bar baz')
    expect(sideEffects).toHaveLength(2)
})

test('with flux-view, childrenSync$', () => {
    const sideEffects = []
    const foo = { text: 'foo' }
    const fooBar = { text: 'foo bar' }
    const source$ = new BehaviorSubject<{ text: string }[]>([fooBar])

    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                fromFluxView: true,
                tag: 'a',
                style: {
                    display: 'flex',
                },
                children: childrenFromStore$(
                    source$,
                    ({ text }) => ({
                        innerText: text,
                    }),
                    {
                        orderOperator: (a, b) => a.text.length - b.text.length,
                        sideEffects: (d) => sideEffects.push(d),
                    },
                ),
            } as FluxViewVirtualDOM,
        ],
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const children = orderedChildren(html)
    expect(children).toHaveLength(1)
    const children0 = orderedChildren(children[0])
    expect(children0[0].innerText).toBe('foo bar')
    source$.next([fooBar, foo])
    const children1 = orderedChildren(children[0])
    expect(children1[0].innerText).toBe('foo')
    expect(children1[1].innerText).toBe('foo bar')
})

test('with VirtualDOM as class', () => {
    class TopBannerView implements FvVirtualDOM {
        // public readonly tag = 'div'
        public readonly id = 'top-banner'
        public readonly class = 'w-100 fv-text-primary'
        public readonly style = {
            backgroundColor: 'black',
        }
        public readonly children: FvVirtualDOM[]

        constructor() {
            this.children = [
                {
                    innerText: attr$(of('foo'), (text) => text, {
                        wrapper: (d) => `${d} bar`,
                    }),
                },
            ]
        }
    }
    class AppView implements VirtualDOM<'div'> {
        public readonly tag = 'div'
        public readonly children: ChildrenLike
        constructor() {
            this.children = [new TopBannerView() as FluxViewVirtualDOM]
        }
    }
    const html = render(new AppView())
    document.body.appendChild(html)
    const children = orderedChildren(html)
    const children0 = orderedChildren(children[0])
    expect(children0[0].innerText).toBe('foo bar')
})
