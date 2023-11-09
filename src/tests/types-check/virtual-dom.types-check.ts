import { SupportedTags, VirtualDOM } from '../../lib'
import { of } from 'rxjs'
import { AssertTrue as Assert, Has, IsExact } from 'conditional-type-checks'
import { AnyVirtualDOM, AttributeLike } from '../../lib/api'

{
    // virtualDOM OK
    const _: VirtualDOM<'div'> = {
        tag: 'div',
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
    // Wrong property's type
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        // @ts-expect-error -- wrong type (should be string)
        innerText: 5,
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
