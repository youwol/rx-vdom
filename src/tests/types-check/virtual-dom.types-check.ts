import { VirtualDOM } from '../../lib'
import { of } from 'rxjs'
import { AssertFalse, AssertTrue as Assert, Has } from 'conditional-type-checks'

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
    // connectedCallback KO
    const _: VirtualDOM<'b'> = {
        tag: 'b',
        innerText: 'foo',
        connectedCallback: (elem) => {
            // href is not available on 'b'
            type _ = AssertFalse<Has<typeof elem, { href: string }>>
        },
    }
}
