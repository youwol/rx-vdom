import { RxHTMLElement } from './virtual-dom'
import { Configuration } from '@rxConfig'
import { setup } from '../auto-generated'
import { AssertTrue as Assert, Has, IsExact } from 'conditional-type-checks'

/**
 * Make sure that `Configuration.TypeCheck` is valid.
 */
type _ConfigTypeCheckOK = Assert<
    Has<'strict' | 'none', Configuration['TypeCheck']>
>

/**
 * Make sure that `Configuration.SupportedHTMLTagsOK` is valid.
 */
type _ConfigSupportedHTMLTagsOK = Assert<
    IsExact<
        Extract<
            keyof HTMLElementTagNameMap,
            Configuration['SupportedHTMLTags']
        >,
        Configuration['SupportedHTMLTags']
    >
>

export const customElementPrefix = `${setup.name.split('/')[1]}-${
    setup.apiVersion
}`

/**
 *
 * Supported tags encompass all [HTML elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element),
 * with the following exceptions:
 * *  `dialog`: Results in a runtime error due to an inability to be instantiated in Mozilla.
 * *  `search`:  Causes a runtime error due to instantiation issues in Jest tests.
 * *  `form`: Triggers compile-time errors, the cause of which is not currently understood.
 * */
export type SupportedHTMLTags = Configuration['SupportedHTMLTags']
export type TypeCheck = Configuration['TypeCheck']

export function factory<Tag extends SupportedHTMLTags>(
    tag: Tag,
): RxHTMLElement<Tag> {
    if (!CustomElementsMap[tag as string]) {
        throw Error(
            `The element ${tag} is not registered in flux-view's factory`,
        )
    }

    return document.createElement(tag, {
        is: `${customElementPrefix}-${tag}`,
    }) as RxHTMLElement<Tag>
}

/**
 * Taken from lib.dom.ts (HTMLElementTagNameMap).
 *
 * Supported tags encompass all [HTML elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element),
 * Instantiation of custom elements fails in some scenario and are removed from now:
 * *  `dialog`: Results in a runtime error due to an inability to be instantiated in Mozilla.
 * *  `search`:  Causes a runtime error due to instantiation issues in Jest tests.
 */
export const CustomElementsMap = {
    a: HTMLAnchorElement,
    abbr: HTMLElement,
    address: HTMLElement,
    area: HTMLAreaElement,
    article: HTMLElement,
    aside: HTMLElement,
    audio: HTMLAudioElement,
    b: HTMLElement,
    base: HTMLBaseElement,
    bdi: HTMLElement,
    bdo: HTMLElement,
    blockquote: HTMLQuoteElement,
    body: HTMLBodyElement,
    br: HTMLBRElement,
    button: HTMLButtonElement,
    canvas: HTMLCanvasElement,
    caption: HTMLTableCaptionElement,
    cite: HTMLElement,
    code: HTMLElement,
    col: HTMLTableColElement,
    colgroup: HTMLTableColElement,
    data: HTMLDataElement,
    datalist: HTMLDataListElement,
    dd: HTMLElement,
    del: HTMLModElement,
    details: HTMLDetailsElement,
    dfn: HTMLElement,
    div: HTMLDivElement,
    //dialog: HTMLDialogElement;
    dl: HTMLDListElement,
    dt: HTMLElement,
    em: HTMLElement,
    embed: HTMLEmbedElement,
    fieldset: HTMLFieldSetElement,
    figcaption: HTMLElement,
    figure: HTMLElement,
    footer: HTMLElement,
    //form: HTMLFormElement,
    h1: HTMLHeadingElement,
    h2: HTMLHeadingElement,
    h3: HTMLHeadingElement,
    h4: HTMLHeadingElement,
    h5: HTMLHeadingElement,
    h6: HTMLHeadingElement,
    head: HTMLHeadElement,
    header: HTMLElement,
    hgroup: HTMLElement,
    hr: HTMLHRElement,
    html: HTMLHtmlElement,
    i: HTMLElement,
    iframe: HTMLIFrameElement,
    img: HTMLImageElement,
    input: HTMLInputElement,
    ins: HTMLModElement,
    kbd: HTMLElement,
    label: HTMLLabelElement,
    legend: HTMLLegendElement,
    li: HTMLLIElement,
    link: HTMLLinkElement,
    main: HTMLElement,
    map: HTMLMapElement,
    mark: HTMLElement,
    menu: HTMLMenuElement,
    meta: HTMLMetaElement,
    meter: HTMLMeterElement,
    nav: HTMLElement,
    noscript: HTMLElement,
    object: HTMLObjectElement,
    ol: HTMLOListElement,
    optgroup: HTMLOptGroupElement,
    option: HTMLOptionElement,
    output: HTMLOutputElement,
    p: HTMLParagraphElement,
    picture: HTMLPictureElement,
    pre: HTMLPreElement,
    progress: HTMLProgressElement,
    q: HTMLQuoteElement,
    rp: HTMLElement,
    rt: HTMLElement,
    ruby: HTMLElement,
    s: HTMLElement,
    samp: HTMLElement,
    script: HTMLScriptElement,
    //search: HTMLElement,
    section: HTMLElement,
    select: HTMLSelectElement,
    slot: HTMLSlotElement,
    small: HTMLElement,
    source: HTMLSourceElement,
    span: HTMLSpanElement,
    strong: HTMLElement,
    style: HTMLStyleElement,
    sub: HTMLElement,
    summary: HTMLElement,
    sup: HTMLElement,
    table: HTMLTableElement,
    tbody: HTMLTableSectionElement,
    td: HTMLTableCellElement,
    template: HTMLTemplateElement,
    textarea: HTMLTextAreaElement,
    tfoot: HTMLTableSectionElement,
    th: HTMLTableCellElement,
    thead: HTMLTableSectionElement,
    time: HTMLTimeElement,
    title: HTMLTitleElement,
    tr: HTMLTableRowElement,
    track: HTMLTrackElement,
    u: HTMLElement,
    ul: HTMLUListElement,
    var: HTMLElement,
    video: HTMLVideoElement,
    wbr: HTMLElement,
}
