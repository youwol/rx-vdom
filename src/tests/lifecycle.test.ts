import { render, VirtualDOM } from '../lib'
import { BehaviorSubject, Subject } from 'rxjs'

function observersCount(obs$: Subject<unknown>) {
    // noinspection JSDeprecatedSymbols -- will need to find a better way when moving to RxJS#8
    return obs$.observers.length
}
test('connected/disconnected callback & subscriptions', () => {
    //spy.flush()
    const obs$ = new BehaviorSubject<string>('foo')
    const events = []
    const dataCustom = []
    const custom$ = new BehaviorSubject(1)
    const sub = custom$.subscribe((d) => {
        dataCustom.push(d)
    })

    const vDom: VirtualDOM<'div'> = {
        tag: 'div',
        innerText: obs$,
        connectedCallback: (elem) => {
            events.push('connected')
            elem.ownSubscriptions(sub)
        },
        disconnectedCallback: () => {
            events.push('disconnected')
        },
    }
    const html = render(vDom)

    document.body.appendChild(html)
    expect(html['innerText']).toBe('foo')
    expect(events[0]).toBe('connected')

    expect(observersCount(obs$)).toBe(1)
    expect(observersCount(custom$)).toBe(1)
    custom$.next(2)
    expect(dataCustom).toHaveLength(2)

    document.body.innerHTML = ''
    expect(events[1]).toBe('disconnected')
    expect(observersCount(obs$)).toBe(0)
    expect(observersCount(custom$)).toBe(0)

    custom$.next(3)
    expect(dataCustom).toHaveLength(2)
})
