import { render, VirtualDOM } from '../lib'
import { of, Subject } from 'rxjs'
import { ResolvedHTMLElement } from '../lib/api'

test('observable attribute', () => {
    const vDom: VirtualDOM<'a'> = {
        tag: 'a',
        innerText: 'foo',
        href: of('https://foo.com'),
    }
    const html = render(vDom)
    document.body.appendChild(html)
    expect(html.href).toBe('https://foo.com/')
})

test('rxAttribute', () => {
    const source$ = new Subject()
    const sideEffectElements: ResolvedHTMLElement<string, 'a'>[] = []
    const vDom: VirtualDOM<'a'> = {
        tag: 'a',
        innerText: 'foo',
        href: {
            source$: source$,
            vdomMap: (d: string) => d,
            untilFirst: 'https://bar.com',
            wrapper: (d) => `${d}/#baz`,
            sideEffects: (elem: ResolvedHTMLElement<string, 'a'>) => {
                sideEffectElements.push(elem)
            },
        },
    }
    const html = render(vDom)
    document.body.appendChild(html)
    expect(html.href).toBe('https://bar.com/#baz')
    source$.next('https://foo.com')

    expect(html.href).toBe('https://foo.com/#baz')
    expect(sideEffectElements).toHaveLength(2)
    expect(sideEffectElements[0].domainData).toBeFalsy()
    expect(sideEffectElements[0].element).toBe(html)
    expect(sideEffectElements[1].domainData).toBe('https://foo.com')
    expect(sideEffectElements[1].element).toBe(html)
})

test('observable on style', () => {
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'div',
                style: of({ backgroundColor: 'red' }),
            },
        ],
    }
    const html = render(vDom)
    document.body.appendChild(html)
    expect(html.firstChild['style'].backgroundColor).toBe('red')
})

test('observable on custom attribute', () => {
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'div',
                style: of({ backgroundColor: 'red' }),
            },
        ],
    }
    const html = render(vDom)
    document.body.appendChild(html)
    expect(html.firstChild['style'].backgroundColor).toBe('red')
})
