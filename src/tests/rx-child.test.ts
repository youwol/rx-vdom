import { render, VirtualDOM, ResolvedHTMLElement } from '../lib'
import { Subject } from 'rxjs'

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
                // The type VirtualDOM<'div'> below is required because of the 'form' tag (related to AnyVirtualDOM)
                wrapper: (d: VirtualDOM<'div'>) => ({
                    // ...d,
                    tag: 'div',
                    class: 'wrapper',
                    innerText: d.innerText,
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

test('child resolve to undefined', () => {
    const source$ = new Subject<string>()
    const sideEffectElements: ResolvedHTMLElement<string, 'div'>[] = []

    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        id: 'container',
        children: [
            {
                source$,
                vdomMap: (innerText: string | undefined) =>
                    innerText && { tag: 'div', innerText },
                untilFirst: { tag: 'div', innerText: 'untilFirst', style: {} },
                // The type VirtualDOM<'div'> below is required because of the 'form' tag (related to AnyVirtualDOM)
                wrapper: (d: VirtualDOM<'div'> | undefined) =>
                    d && { ...d, class: 'wrapper' },
                sideEffects: (elem: ResolvedHTMLElement<string, 'div'>) => {
                    sideEffectElements.push(elem)
                },
            },
        ],
    }
    const html = render(vDom)
    document.body.innerHTML = ''
    document.body.appendChild(html)
    const elem = document.getElementById('container')
    expect(elem).toBeTruthy()
    let children = [...elem.children]
    expect(children).toHaveLength(1)
    expect(children[0]['innerText']).toBe('untilFirst')
    expect(children[0].className).toBe('wrapper')

    source$.next(undefined)
    children = [...elem.children]
    expect(children).toHaveLength(0)
})
