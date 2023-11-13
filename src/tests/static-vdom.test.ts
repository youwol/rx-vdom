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

test('Component as class', () => {
    class Foo implements VirtualDOM<'div'> {
        public readonly tag = 'div'
        public readonly class = 'd-flex flex-column'
        public readonly children = [
            {
                tag: 'a' as const,
                innerText: 'foo',
                href: 'https://foo.com',
            },
        ]
        constructor() {}
    }
    const html = render(new Foo())
    document.body.appendChild(html)
    expect(html.firstChild['innerText']).toBe('foo')
    expect(html.firstChild['href']).toBe('https://foo.com/')
})

test('Component as class 2', () => {
    class Foo implements VirtualDOM<'div'> {
        public readonly tag = 'div'
        public readonly class: Observable<string>
        public readonly innerText: RxAttribute<string, string>
        public readonly children: ChildLike[]
        constructor() {
            this.class = of('d-flex')
            this.innerText = {
                source$: of('Foo container'),
                vdomMap: (d) => d,
            }
            this.children = [
                {
                    tag: 'a' as const,
                    innerText: 'foo',
                    href: 'https://foo.com',
                },
                {
                    source$: of({ name: 'bar' }),
                    vdomMap: ({ name }) => ({
                        tag: 'div',
                        innerText: name,
                    }),
                },
            ]
        }
    }
    const html = render(new Foo())
    document.body.appendChild(html)
    expect(html['innerText']).toBe('Foo container')
    expect(html['className']).toBe('d-flex')
    const children = [...html.children] as [
        RxHTMLElement<'a'>,
        RxHTMLElement<'div'>,
    ]
    expect(children).toHaveLength(2)
    expect(children[0].innerText).toBe('foo')
    expect(children[0].href).toBe('https://foo.com/')
    expect(children[1].innerText).toBe('bar')
})

test('Component as class 3', () => {
    class Foo implements VirtualDOM<'div'> {
        public readonly tag = 'div'
        public readonly children = {
            policy: 'append' as const,
            source$: of([{ name: 'foo' }, { name: 'bar' }]),
            vdomMap: ({ name }) => ({
                tag: 'div' as const,
                innerText: name,
            }),
        }
        public readonly foo = 42
        constructor() {}
    }
    const html = render(new Foo())
    document.body.appendChild(html)
    const children = [...html.children] as [
        RxHTMLElement<'div'>,
        RxHTMLElement<'div'>,
    ]
    expect(children).toHaveLength(2)
    expect(children[0].innerText).toBe('foo')
    expect(children[1].innerText).toBe('bar')
})
