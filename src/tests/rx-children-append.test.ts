import { render, VirtualDOM } from '../lib'
import { Subject } from 'rxjs'
import { orderedChildren } from './utils'

beforeEach(() => {
    document.body.innerHTML = ''
})
test('simple scenario', () => {
    type Domain = { id: string; text: string }
    const source$ = new Subject<Domain[]>()
    let updateTracker = undefined
    const store = {
        foo: { text: 'short', id: 'foo' },
        bar: { text: 'a bit longer', id: 'bar' },
        baz: { text: 'even more longer', id: 'baz' },
    }
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        id: 'container',
        style: {
            display: 'flex',
        },
        children: {
            policy: 'append',
            source$,
            vdomMap: (data: Domain) => ({
                tag: 'div',
                id: data.id,
                innerText: data.text,
            }),
            orderOperator: (a: Domain, b: Domain) => {
                return a.text.length - b.text.length
            },
            sideEffects: (parent, update) => {
                updateTracker = update
            },
        },
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const elem = document.getElementById('container')
    expect(elem).toBeTruthy()
    let children = [...elem.children]
    expect(children).toHaveLength(0)

    source$.next([store.bar, store.foo])

    children = orderedChildren(elem)
    expect(children).toHaveLength(2)
    expect(children[0]['innerText']).toBe('short')
    expect(children[1]['innerText']).toBe('a bit longer')
    expect(updateTracker.added).toHaveLength(2)
    expect(updateTracker.updated).toHaveLength(0)
    expect(updateTracker.removed).toHaveLength(0)
    source$.next([store.baz, store.foo, store.bar])

    children = orderedChildren(elem)

    expect(children).toHaveLength(5)
    expect(children[0]['innerText']).toBe('short')
    expect(children[1]['innerText']).toBe('short')
    expect(children[2]['innerText']).toBe('a bit longer')
    expect(children[3]['innerText']).toBe('a bit longer')
    expect(children[4]['innerText']).toBe('even more longer')
    expect(updateTracker.added).toHaveLength(3)
    expect(updateTracker.updated).toHaveLength(0)
    expect(updateTracker.removed).toHaveLength(0)
})

test('no order operator', () => {
    type Domain = { id: string; text: string }

    const source$ = new Subject<Domain[]>()
    const store = {
        foo: { text: 'short', id: 'foo' },
        bar: { text: 'a bit longer', id: 'bar' },
        baz: { text: 'even more longer', id: 'baz' },
    }
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        id: 'container',
        style: {
            display: 'flex',
        },
        children: {
            policy: 'append',
            source$,
            vdomMap: (data: Domain) => ({
                tag: 'div',
                id: data.id,
                innerText: data.text,
            }),
        },
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const elem = document.getElementById('container')
    expect(elem).toBeTruthy()
    let children = [...elem.children]
    expect(children).toHaveLength(0)

    source$.next([store.bar, store.foo])

    children = orderedChildren(elem)
    expect(children).toHaveLength(2)
    expect(children[0]['innerText']).toBe('a bit longer')
    expect(children[1]['innerText']).toBe('short')
    source$.next([store.baz, store.foo, store.bar])

    children = orderedChildren(elem)

    expect(children).toHaveLength(5)
    expect(children[0]['innerText']).toBe('a bit longer')
    expect(children[1]['innerText']).toBe('short')
    expect(children[2]['innerText']).toBe('even more longer')
    expect(children[3]['innerText']).toBe('short')
    expect(children[4]['innerText']).toBe('a bit longer')
})
