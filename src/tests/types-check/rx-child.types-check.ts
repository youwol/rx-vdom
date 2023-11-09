import { SupportedTags, VirtualDOM } from '../../lib'
import { of } from 'rxjs'
import { AssertTrue as Assert, IsExact } from 'conditional-type-checks'
import { ResolvedHTMLElement, RxChild } from '../../lib/api'

{
    // RxChild, no type hints
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                source$: of('https://foo.com'),
                vdomMap: (href) => {
                    // This should pass ideally: type _ = Assert<IsExact<typeof href, string>>
                    return {
                        tag: 'b',
                        // can not catch this error like that
                        href,
                        // and this one neither
                        foo: 5,
                    }
                },
                sideEffects: (elem) => {
                    type _ = Assert<
                        IsExact<
                            typeof elem,
                            ResolvedHTMLElement<unknown, SupportedTags>
                        >
                    >
                    // There is not type inference here: available are only the properties of HTMLElement
                    const _0 = elem.element.innerText
                    // @ts-expect-error -- href is not available on any html elements
                    const _1 = elem.element.href
                },
            },
        ],
    }
}

{
    // RxChild, RxChild type hints OK
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                source$: of('https://foo.com'),
                vdomMap: (href) => {
                    type _ = Assert<IsExact<typeof href, string>>
                    return {
                        tag: 'a',
                        href,
                    }
                },
                wrapper: (from) => {
                    type Tag = Pick<typeof from, 'tag'>
                    type _ = Assert<IsExact<Tag, { tag: 'a' }>>
                    return from
                },
                sideEffects: (elem) => {
                    type _ = Assert<
                        IsExact<typeof elem, ResolvedHTMLElement<string, 'a'>>
                    >
                    const _0 = elem.element.innerText
                    const _1 = elem.element.href
                },
            } as RxChild<string, VirtualDOM<'a'>>,
        ],
    }
}

{
    // RxChild, RxChild type hints KO: tag mismatch
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            // @ts-expect-error -- 'b' is not 'a'
            {
                source$: of('https://foo.com'),
                vdomMap: (href) => {
                    type _ = Assert<IsExact<typeof href, string>>
                    return {
                        tag: 'b',
                        // can not catch this error like that
                        href,
                        // and this one neither
                        foo: 5,
                    }
                },
                wrapper: (from) => {
                    return from
                },
                sideEffects: (elem) => {
                    type _ = Assert<
                        IsExact<typeof elem, ResolvedHTMLElement<string, 'a'>>
                    >
                    const _0 = elem.element.innerText
                    const _1 = elem.element.href
                },
            } as RxChild<string, VirtualDOM<'a'>>,
        ],
    }
}

{
    // RxChild, RxChild type hints KO: wrong side effects
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                source$: of('https://foo.com'),
                vdomMap: (href) => {
                    type _ = Assert<IsExact<typeof href, string>>
                    return {
                        tag: 'b',
                    }
                },
                wrapper: (from) => {
                    return from
                },
                sideEffects: (elem) => {
                    type _ = Assert<
                        IsExact<typeof elem, ResolvedHTMLElement<string, 'b'>>
                    >
                    const _0 = elem.element.innerText
                    // @ts-expect-error -- href not available in 'b'
                    const _1 = elem.element.href
                },
            } as RxChild<string, VirtualDOM<'b'>>,
        ],
    }
}

{
    // RxChild, I expected this to work
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                source$: of('https://foo.com'),
                vdomMap: (href): VirtualDOM<'a' | 'b'> => {
                    type _ = Assert<IsExact<typeof href, string>>
                    return {
                        tag: 'b',
                        // @ts-expect-error -- href is not available on 'b'
                        href,
                    }
                },
                sideEffects: (elem) => {
                    // type _ = Assert<
                    //     IsExact<
                    //         typeof elem,
                    //         ResolvedHTMLElement<string, 'a' | 'b'>
                    //     >
                    // >
                    const _0 = elem.element.innerText
                    // @ts-expect-error -- href is not available on 'b'
                    const _1 = elem.element.href
                },
            } as RxChild<string>,
        ],
    }
}
