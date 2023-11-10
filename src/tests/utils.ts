export const orderedChildren = (elem: HTMLElement) =>
    [...elem.children].sort(
        (a: HTMLElement, b: HTMLElement) =>
            parseInt(a.style.order) - parseInt(b.style.order),
    )
