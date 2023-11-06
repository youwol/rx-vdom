import { render, VirtualDOM, RxHTMLElement } from '../lib'
import { AssertTrue as Assert, Has, IsExact } from 'conditional-type-checks'

test('virtual dom and types', () => {
    const vDom: VirtualDOM<'a'> = {
        tag: 'a',
        innerText: 'foo',
        href: 'https://foo.com',
    }
    const html = render(vDom)
    type _ = Assert<IsExact<typeof html, RxHTMLElement<'a'>>>
    type _1 = Assert<Has<typeof html, HTMLAnchorElement>>
    document.body.appendChild(html)
    expect(html.href).toBe('https://foo.com/')
})
