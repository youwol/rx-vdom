export const orderedChildren = (elem: HTMLElement): HTMLElement[] =>
    [...elem.children].sort(
        (a: HTMLElement, b: HTMLElement) =>
            parseInt(a.style.order) - parseInt(b.style.order),
    ) as unknown as HTMLElement[]
