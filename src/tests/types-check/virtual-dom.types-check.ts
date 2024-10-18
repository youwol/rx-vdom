import {
    Observable,
    RxAttribute,
    VirtualDOM,
    AnyVirtualDOM,
    AttributeLike,
} from '../../lib'
import { of } from 'rxjs'
import { AssertTrue as Assert, Has, IsExact } from 'conditional-type-checks'

// Define a no-op function to "use" types. It prevents linter errors.
function useType<T>(_value: T | unknown) {
    //no-op
}
// Define a no-op function to "use" variables. It prevents linter errors.
function useVar<T>(_value: T): void {
    //no-op
}

;(() => {
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
                    useType<Assert<IsExact<typeof ev, MouseEvent>>>(null)
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
    useVar(_)
})()
;(() => {
    // Wrong tag check
    const _: VirtualDOM<'b'> = {
        // @ts-expect-error -- 'a' is not 'b'
        tag: 'a',
        innerText: 'foo',
        href: 'https://foo.com',
    }
    useVar(_)
})()
;(() => {
    // Missing tag check
    // @ts-expect-error -- missing tag
    const _: VirtualDOM<'b'> = {
        innerText: 'foo',
    }
    useVar(_)
})()
;(() => {
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
    useVar(_)
})()
;(() => {
    // Wrong property's type
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        // @ts-expect-error -- wrong type (should be string)
        innerText: 5,
    }
    useVar(_)
})()
;(() => {
    // Wrong style's type
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        // @ts-expect-error -- wrong type (should be string)
        style: 5,
    }
    useVar(_)
})()
;(() => {
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
    useVar(_)
})()
;(() => {
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
    useVar(_)
})()
;(() => {
    // Wrong custom attribue type
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        // @ts-expect-error -- wrong type
        customAttributes: 5,
    }
    useVar(_)
})()
;(() => {
    // Wrong custom attribute key
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'div',
                customAttributes: {
                    // @ts-expect-error -- custom attribute can not be an object
                    foo: { bar: 'baz' },
                },
            },
        ],
    }
    useVar(_)
})()
;(() => {
    // Wrong custom attribute key using observable
    const _: VirtualDOM<'div'> = {
        tag: 'div',
        children: [
            {
                tag: 'div',
                customAttributes: {
                    // @ts-expect-error -- custom attribute can not be an observable
                    foo: of({ bar: 'baz' }),
                },
            },
        ],
    }
    useVar(_)
})()
;(() => {
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
    useVar(_)
})()
;(() => {
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
    useVar(_)
})()
;(() => {
    // wrong property for tag
    const _: VirtualDOM<'b'> = {
        tag: 'b',
        // @ts-expect-error -- href is not available on 'b'
        href: 'https://foo.com',
    }
    useVar(_)
})()
;(() => {
    // Can not override method
    const _: VirtualDOM<'a'> = {
        tag: 'a',
        innerText: 'foo',
        href: 'https://foo.com',
        // @ts-expect-error -- can not redefine method
        appendChild<T extends Node>(_node: T): T {
            return undefined
        },
    }
    useVar(_)
})()
;(() => {
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
    useVar(foo.someAdditionalProperty)
    useType<Assert<IsExact<typeof foo.tag, 'a'>>>(null)
})()
;(() => {
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
    useVar(_)
})()
;(() => {
    // wrong property because readonly
    const _: VirtualDOM<'b'> = {
        tag: 'b',
        // @ts-expect-error -- clientHeight only has getter
        clientHeight: 5,
    }
    useVar(_)
})()
;(() => {
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
    useVar(_)
})()
;(() => {
    // connectedCallback OK
    const _: VirtualDOM<'a'> = {
        tag: 'a',
        innerText: 'foo',
        href: 'https://foo.com',
        connectedCallback: (elem) => {
            useType<Assert<Has<typeof elem, HTMLAnchorElement>>>(null)
        },
    }
    useVar(_)
})()
;(() => {
    // retrieving attributes
    const _: VirtualDOM<'a'> = {
        tag: 'a',
        innerText: 'foo',
        href: 'https://foo.com',
    }
    useType<Assert<IsExact<typeof _.innerText, AttributeLike<string>>>>(null)
    useType<Assert<IsExact<typeof _.href, AttributeLike<string>>>>(null)
    useType<Assert<IsExact<typeof _.tag, 'a'>>>(null)
    useVar(_)
})()
;(() => {
    // Tests on AnyVirtualDOM
    // It is not possible to use straight 'AnyVirtualDOM' because of HTMLFormElement, see comment below.
    type AnyVirtualDOMButForm = Exclude<AnyVirtualDOM, VirtualDOM<'form'>>
    type InnerText = AnyVirtualDOMButForm['innerText']
    useType<Assert<Has<InnerText, string>>>(null)
    useType<Assert<Has<InnerText, Observable<string>>>>(null)
    useType<Assert<Has<InnerText, RxAttribute<unknown, string>>>>(null)
    useType<Assert<Has<InnerText, AttributeLike<string>>>>(null)
    // The following assertion is failing when the 'HTMLFormElement' element is included.
    // It does not make sense for me as
    // *  I can not see why for 'form' tag there would be anything else on top of it
    // *  type hints when overring 'InnerText' gives :
    //      Alias for: RXAnyVirtualDOM["innerText"]
    //      Initial type: Observable<string> | RxAttribute<unknown, string> | string
    useType<
        Assert<
            IsExact<AnyVirtualDOMButForm['innerText'], AttributeLike<string>>
        >
    >(null)
})()
