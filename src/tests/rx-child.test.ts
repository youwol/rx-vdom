import { render, VirtualDOM } from '../lib'
import { Subject } from 'rxjs'
import { ResolvedHTMLElement } from '../lib/api'

test('simple scenario', () => {
    const source$ = new Subject<string>()
    const sideEffectElements: ResolvedHTMLElement<string, 'div'>[] = []

    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        id: 'container',
        children: [
            {
                source$,
                vdomMap: (innerText: string) => ({ tag: 'div', innerText }),
                untilFirst: { tag: 'div', innerText: 'untilFirst', style: {} },
                wrapper: (d) => ({
                    ...d,
                    class: 'wrapper',
                }),
                sideEffects: (elem: ResolvedHTMLElement<string, 'div'>) => {
                    sideEffectElements.push(elem)
                },
            },
        ],
    }
    const html = render(vDom)
    document.body.appendChild(html)
    const elem = document.getElementById('container')
    expect(elem).toBeTruthy()
    let children = [...elem.children]
    expect(children).toHaveLength(1)
    expect(children[0]['innerText']).toBe('untilFirst')
    expect(children[0].className).toBe('wrapper')
    expect(sideEffectElements).toHaveLength(1)
    expect(sideEffectElements[0].element).toBeInstanceOf(HTMLDivElement)

    source$.next('foo')
    children = [...elem.children]
    expect(children).toHaveLength(1)
    expect(children[0]['innerText']).toBe('foo')
    expect(children[0].className).toBe('wrapper')
    expect(sideEffectElements).toHaveLength(2)
    expect(sideEffectElements[1].element).toBeInstanceOf(HTMLDivElement)
})
