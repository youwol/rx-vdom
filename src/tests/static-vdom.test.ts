import { render, VirtualDOM } from '../lib'

test('static attribute', () => {
    const vDom: VirtualDOM<'a'> = {
        tag: 'a',
        innerText: 'foo',
        href: 'https://foo.com',
    }
    const html = render(vDom)
    document.body.appendChild(html)
    expect(html.href).toBe('https://foo.com/')
})

test('static style attribute', () => {
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        style: {
            backgroundColor: 'red',
        },
    }
    const html = render(vDom)
    document.body.appendChild(html)
    expect(html.style.backgroundColor).toBe('red')
})

test('static custom-attribute', () => {
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        customAttributes: {
            hasCustomAttributes: true,
        },
    }
    const html = render(vDom)
    document.body.appendChild(html)
    expect(html.getAttribute('has-custom-attributes')).toBeTruthy()
})

test('Raw HTMLElement child', () => {
    const child = document.createElement('div')
    child.innerText = 'foo'
    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        children: [child],
    }
    const html = render(vDom)
    document.body.appendChild(html)
    expect(html.firstChild['innerText']).toBe('foo')
})
