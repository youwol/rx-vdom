import { SupportedTags, VirtualDOM } from '../../lib'
import { of } from 'rxjs'
import { AssertTrue as Assert, Has, IsExact } from 'conditional-type-checks'
import { AnyVirtualDOM, AttributeLike } from '../../lib/api'

{
    // virtualDOM OK
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        style: {
            backgroundColor: 'red',
        },
        children: [
            {
                tag: 'a',
                href: of('https://foo.com'),
                onclick: (ev) => {
                    type _ = Assert<IsExact<typeof ev, MouseEvent>>
                },
                children: [
                    {
                        tag: 'blockquote',
                        cite: 'author',
                        style: {
                            color: 'black',
                        },
                    },
                ],
            },
        ],
    }
}

{
    // Wrong tag check
    const _: VirtualDOM<'b'> = {
        // @ts-expect-error -- 'a' is not 'b'
        tag: 'a',
        innerText: 'foo',
        href: 'https://foo.com',
    }
}

{
    // Missing tag check
    // @ts-expect-error -- missing tag
    const _: VirtualDOM<'b'> = {
        innerText: 'foo',
    }
}

{
    // Missing tag nested check
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        innerText: 'foo',
        children: [
            // @ts-expect-error -- missing tag
            {
                innerText: 'foo',
            },
        ],
    }
}

{
    // Wrong property's type
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        // @ts-expect-error -- wrong type (should be string)
        innerText: 5,
    }
}

{
    // Wrong style's type
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        // @ts-expect-error -- wrong type (should be string)
        style: 5,
    }
}

{
    // Wrong style's attribute key
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'div',
                style: {
                    // @ts-expect-error -- property does not exist
                    colour: 'white',
                },
            },
        ],
    }
}

{
    // Wrong style's style with observable
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'div',
                // @ts-expect-error -- property does not exist
                style: of({
                    colour: 'white',
                }),
            },
        ],
    }
}

{
    // Wrong custom attribue type
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        // @ts-expect-error -- wrong type
        customAttributes: 5,
    }
}

{
    // Wrong custom attribute key
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'div',
                customAttributes: {
                    // @ts-expect-error -- custom attribute can not be object
                    foo: { bar: 'baz' },
                },
            },
        ],
    }
}

{
    // Wrong custom attribute key using observable
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'div',
                customAttributes: {
                    // @ts-expect-error -- custom attribute can not be object
                    foo: of({ bar: 'baz' }),
                },
            },
        ],
    }
}

{
    // Wrong style's attribute value
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'div',
                style: {
                    // @ts-expect-error -- type error on value
                    textAlign: 'middle',
                },
            },
        ],
    }
}

{
    // Wrong property's type nested
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'div',
                // @ts-expect-error -- wrong type (should be string)
                innerText: 5,
            },
        ],
    }
}

{
    // wrong property for tag
    const _: VirtualDOM<'b'> = {
        tag: 'b',
        // @ts-expect-error -- href is not available on 'b'
        href: 'https://foo.com',
    }
}

{
    // Some test using class definition for virtual dom
    class Foo implements VirtualDOM<'a'> {
        public readonly tag = 'a'
        // We can add some property when using a class
        public readonly someAdditionalProperty = 'https://foo.com'
        // @ts-expect-error -- But we can not reassign an existing property with wrong type
        public readonly href = 5

        public readonly class = 'd-flex flex-column'
        public readonly children: [VirtualDOM<'b'>] = [
            {
                tag: 'b' as const,
                innerText: 'foo',
                // @ts-expect-error -- again, href not available in 'b'
                href: 'https://foo.com',
            },
        ]
    }
    const foo = new Foo()
    type _ = Assert<IsExact<typeof foo.tag, 'a'>>
}

{
    // wrong property for tag, nested
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'b',
                innerText: 'foo',
                // @ts-expect-error -- href is not available on 'b'
                href: 'https://foo.com',
            },
        ],
    }
}

{
    // wrong property because readonly
    const _: VirtualDOM<'b'> = {
        tag: 'b',
        // @ts-expect-error -- clientHeight only has getter
        clientHeight: 5,
    }
}

{
    // wrong property because readonly, nested
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'a',
                href: of('https://foo.com'),
                // @ts-expect-error -- clientHeight only has getter
                clientHeight: 5,
            },
        ],
    }
}

{
    // connectedCallback OK
    const _: VirtualDOM<'a'> = {
        tag: 'a',
        innerText: 'foo',
        href: 'https://foo.com',
        connectedCallback: (elem) => {
            type _ = Assert<Has<typeof elem, HTMLAnchorElement>>
        },
    }
}

{
    // retrieving attributes
    const _: VirtualDOM<'a'> = {
        tag: 'a',
        innerText: 'foo',
        href: 'https://foo.com',
    }
    type _0 = Assert<IsExact<typeof _.innerText, AttributeLike<string>>>
    type _1 = Assert<IsExact<typeof _.href, AttributeLike<string>>>
    type _2 = Assert<IsExact<typeof _.tag, 'a'>>
}

{
    // Tests on AnyVirtualDOM
    type _0 = Assert<IsExact<AnyVirtualDOM['innerText'], AttributeLike<string>>>
    type _1 = Assert<IsExact<AnyVirtualDOM['tag'], SupportedTags>>
}
