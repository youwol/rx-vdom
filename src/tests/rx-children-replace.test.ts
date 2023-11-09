import { render, VirtualDOM } from '../lib'
import { Subject } from 'rxjs'
import { ResolvedHTMLElement } from '../lib/api'

test('simple scenario', () => {
    const source$ = new Subject<number>()
    const sideEffectElements: ResolvedHTMLElement<string, 'div'>[] = []
    const texts = {
        0: 'foo',
        1: 'bar',
        2: 'baz',
    }
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        id: 'container',
        children: {
            policy: 'replace',
            source$,
            vdomMap: (count: number) =>
                new Array<number>(count).fill(0).map((_, i) => ({
                    tag: 'div',
                    id: `child${i}`,
                    innerText: texts[i],
                })),
            untilFirst: [{ tag: 'div', innerText: 'untilFirst' }],
            wrapper: (d) => [...d, { tag: 'div', innerText: 'wrapper' }],
            sideEffects: (elem: ResolvedHTMLElement<string, 'div'>) => {
                sideEffectElements.push(elem)
            },
        },
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const elem = document.getElementById('container')
    expect(elem).toBeTruthy()
    let children = [...elem.children]
    expect(children).toHaveLength(2)
    expect(children[0]['innerText']).toBe('untilFirst')
    expect(children[1]['innerText']).toBe('wrapper')
    expect(sideEffectElements).toHaveLength(1)
    source$.next(2)
    children = [...elem.children]
    expect(children).toHaveLength(3)
    expect(children[0]['innerText']).toBe('foo')
    expect(children[1]['innerText']).toBe('bar')
    expect(children[2]['innerText']).toBe('wrapper')
    expect(sideEffectElements).toHaveLength(2)
})
