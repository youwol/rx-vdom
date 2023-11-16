import { render, VirtualDOM } from '../lib'
import { register } from '../lib/core'
import { setup } from '../auto-generated'
import { BehaviorSubject, of } from 'rxjs'
import { factory } from '../lib/factory'

let errors = []
let warnings = []

console.error = (d) => {
    errors.push(d)
}
console.warn = (d) => {
    warnings.push(d)
}
beforeEach(() => {
    errors = []
    warnings = []
})
test('render undefined vdom', () => {
    const html = render(undefined)
    expect(html).toBeFalsy()
    expect(errors[0]).toBe('Got an undefined virtual DOM, return empty div')
})

test('undefined child', () => {
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        children: [undefined],
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const children = [...html.children]
    expect(children).toHaveLength(0)
})

test('wrong children type', () => {
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        innerText: 'parent',
        children: { tag: 'div' } as never,
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const children = [...html.children]
    expect(children).toHaveLength(0)
    expect(errors[0]).toBe('Type of children unknown')
})

test('double register call does not break', () => {
    expect(() => register()).not.toThrow()
    expect(warnings[0]).toBe(
        `@youwol/rx-vdom with api version ${setup.apiVersion} has already defined custom elements`,
    )
})

test('unknown children policy', () => {
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        id: 'container',
        style: {
            display: 'flex',
        },
        children: {
            policy: 'unknown-policy' as never,
            source$: of(),
            vdomMap: () => ({
                tag: 'div',
            }),
        },
    }
    const html = render(vDom)
    document.body.appendChild(html)
    expect(errors[0]).toBe('Unknown RxChildren policy')
})

test('factory of unkwown tag throw', () => {
    expect(() => factory('foo' as never)).toThrow(
        "The element foo is not registered in flux-view's factory",
    )
})

test('rxChildren sync, not d-flex', () => {
    type Domain = { id: string; text: string }
    const foo = { text: 'short', id: 'foo' }
    const bar = { text: 'a bit longer', id: 'bar' }
    const source$ = new BehaviorSubject<Domain[]>([foo])
    const createVDOM = (policy: 'append' | 'sync'): VirtualDOM<'div'> => {
        return {
            tag: 'div',
            id: 'container',
            children: {
                policy,
                source$,
                vdomMap: (data: Domain) => ({
                    tag: 'div',
                    id: data.id,
                    innerText: data.text,
                }),
                orderOperator: (a: Domain, b: Domain) => {
                    return a.text.length - b.text.length
                },
            },
        }
    }
    const vDomAppend = createVDOM('append')
    const htmlAppend = render(vDomAppend)
    document.body.appendChild(htmlAppend)
    source$.next([foo, bar])
    expect(
        errors[0].startsWith(
            'To enable dynamic re-ordering of elements in rx-vdom,',
        ),
    ).toBeTruthy()

    const vDomSync = createVDOM('sync')
    const htmlSync = render(vDomSync)
    document.body.appendChild(htmlSync)
    source$.next([foo, bar])
    expect(
        errors[1].startsWith(
            'To enable dynamic re-ordering of elements in rx-vdom,',
        ),
    ).toBeTruthy()
})
