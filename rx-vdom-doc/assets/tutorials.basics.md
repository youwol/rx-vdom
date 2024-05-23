# Getting Started

<note level="hint" label="Forewords">
Learning to use rx-vdom essentially narrow down to learning reactive programming. 
Reactive programming can be challenging at first with a steep learning curve. 
However, it has broad applications as it is a declarative programming paradigm designed to model responsive, resilient, 
elastic, and message-driven systems. More information can be found 
<a href='https://reactivex.io/' target="_blank">here</a>.
</note>

This tutorial is in the form of notebook, allowing you to modify and run any cells.

Let's start by installing the dependencies:
<js-cell>
const { rxDom, rxjs } = await webpm.install({
    modules: [
        '@youwol/rx-vdom#1.0.2-wip as rxDom', 
        'rxjs#^7.5.6 as rxjs'
    ]
});
</js-cell>
Here:

- **@youwol/rx-vdom** is the library we are talking about.
- **rxjs** is the reactive programing engine, an implementation of <a href='https://reactivex.io/' target="_blank">
  Reactive X</a>.

<note level="warning" label="Important">
An appealing feature of **rx-vdom** is that the library **is not** required to define views,
only to render them.
</note>

## VirtualDOM

VirtualDOM mirrors the characteristics and structure of an HTML DOM element with the ability
for its attributes and children to be supplied through time dependent variables modeled using **Observable**.

<note level='info'>
The Observable model allows you to treat streams of asynchronous events with the same sort of simple, composable 
operations that you use for collections of data items like arrays.
</note>

Virtual DOMs can be transformed into actual HTML elements using the [render](@nav/api.render) function.

The following cell defines a simple (static) virtual DOM and renders it:

<js-cell>
let vDOM = { 
     tag: 'div',
     class:'d-flex align-items-center rounded p-2 bg-light',
     children: [
         { tag: 'i', class:'fas fa-check text-success'},
         { tag: 'i', class:'mx-1' },
         { tag: 'div', innerText:'Introduces vDOM' }
     ]
}
const htmlElement = rxDom.render(vDOM)
display(htmlElement)
</js-cell>

Virtual DOMs are represented as JavaScript objects that mimic HTMLElements:

- They exhibit a hierarchical parent-child structure.
- Each element type is defined by its HTML tag.
- They expose the attributes of corresponding HTMLElement for the given tag.

In addition to regular HTMLElement, they introduce additional lifecycle hooks when the virtual DOM is added
or removed from the rendered page.

<note level='hint' >
It is possible to include regular HTMLElements as children of a virtual DOM (within the `children` attribute).
This allows for the integration of views created by other libraries within VirtualDOMs.
</note>

Reactivity is achieved by defining parts of the Virtual DOM using a JavaScript object with the following form:

```typescript
{
    source$: Observable<T>,
    vdomMap: (data: T) => Attribute | Child | Children
}
```

where:

- **source$** is the observable that emits data of type `T`, referred to as **domain data**,
  which are part of the application's logic.
- **vdomMap** is the function that converts domain data `T` to a view element.

In the following sections, different uses of reactivity to define either attributes, a child, or children are provided.
The examples are based on the following domain data object:

<js-cell>

const physicists = [
    {
        name: "Albert Einstein",
        synopsis: `Known for the theory of relativity, which revolutionized the understanding of space, time, and 
gravity. His famous equation E = mc^2 established the relationship between mass and energy.`
    },
    {
        name: "Niels Bohr",
        synopsis: `A pioneer in quantum mechanics, he developed the Bohr model of the atom, which introduced the theory
of electrons orbiting the nucleus in quantized energy levels.`
    },
    {
        name: "Werner Heisenberg",
        synopsis: `Formulated the Heisenberg Uncertainty Principle, which states that the position and momentum of a 
particle cannot both be precisely determined at the same time.`
    },
    {
        name: "Erwin Schrödinger",
        synopsis: `Known for the Schrödinger equation, a fundamental equation of quantum mechanics that describes how 
the quantum state of a physical system changes with time.`
    },
    {
        name: "Richard Feynman",
        synopsis: `Made significant contributions to quantum electrodynamics (QED) and developed the Feynman diagrams,
a graphical representation of particle interactions.`
    },
    {
        name: "Paul Dirac",
        synopsis: `Known for the Dirac equation, which describes the behavior of fermions and predicted the existence 
of antimatter.`
    },
    {
        name: "Max Planck",
        synopsis: `Considered the father of quantum theory, he introduced the concept of energy quanta and the Planck 
constant.`
    },
    {
        name: "Wolfgang Pauli",
        synopsis: `Formulated the Pauli Exclusion Principle, which states that no two electrons can occupy the same 
quantum state simultaneously within a quantum system.`
    },
    {
        name: "Louis de Broglie",
        synopsis: `Proposed the wave-particle duality theory, which suggests that particles can exhibit both wave-like 
and particle-like properties.`
    },
    {
        name: "David Bohm",
        synopsis: `Known for his work in quantum theory and his interpretation of quantum mechanics,
the Bohmian mechanics, which offers an alternative to the standard Copenhagen interpretation.`
    }
]
</js-cell>

## Rx Attribute

A reactive attribute is an attribute ( _e.g._ `class`, `id`, `style`) of the virtual DOM that is bound to an observable.
The following example picks a random physicist among the above list and displays their name.

<js-cell>
const rndPhysicist$ = rxjs.timer(0, 1000).pipe(
    rxjs.map((tick) => {
        const index = Math.floor(Math.random() * physicists.length);
        return physicists[index];
    })
)
vDOM = {
   tag: 'div',
   class: 'bg-light text-center',
   innerText: {
      source$: rndPhysicist$,
      vdomMap: (physicist) => physicist.name,
   },
}

display(vDOM)
</js-cell>

In this example, the **`innerText`** attribute of the virtual DOM is bound to the observable
**`rndPhysicist$`**. This observable defines the logic of the application by picking a random physicist from the
list every second. The **`vdomMap`** function converts this domain data into a view element.

<note level='hint'>
A convention is to suffix reactive variables with `$`.
</note>

Additional parameters such as `wrapper`, `untilFirst`, and `sideEffects` can be provided when defining a reactive
attribute. More information can be found in the [RxAttribute](@nav/api.RxAttribute) API documentation.

## Rx Child

A reactive child is a child of a virtual DOM that is bound to an observable.
The following example illustrates its creation:

<js-cell>
const physicistView = (physicist) => {
	return {
        tag: 'div',
    	class:'p-2 my-1 border rounded bg-light', 
        children: [
            {
                tag: 'div',
                style:{ fontWeight: 'bolder' },
                innerText: physicist.name
            },
            {
                tag: 'div',
                class: 'text-justify',
                innerText: physicist.synopsis.replace(/\n/g, '')
            },
        ]
    }
}

vDOM = {
     tag: 'div',
     class:'p-2',
     children:[
         {
             innerText: "A randomly picked physicist:"
         },
         {
             source$: rndPhysicist$,
             vdomMap: physicistView
         }
     ]
}
display(vDOM)
</js-cell>

Defining a reactive child uses the same API as a reactive attribute, with the difference being that the **`vdomMap`**
function returns a VirtualDOM.

<note level='hint'>
when defining style attribute, the keys can be provided either using their standard names
(*e.g.* `'font-weight'`) or their camel case versions (like here, `'fontWeight'`).
</note>

Here's an example allowing selection from a dropdown list:

<js-cell>
const selected$ = new rxjs.BehaviorSubject(physicists[0])

const selectView = (items) => {
    const selected$ = new rxjs.BehaviorSubject(items[0])
    return {
        tag:'select',
        selected$,
        children: items.map((p) => ({
            tag:'option',
            innerText: p.name,
        })),
        onchange: (ev) => selected$.next(items[ev.target.selectedIndex])
    }
}
const physicistDropDown = selectView(physicists)
vDOM = {
    tag: 'div',
    class:'p-2',
    children:[
        physicistDropDown,
        {
            source$: physicistDropDown.selected$,
            vdomMap: physicistView
        }
    ]
}
display(vDOM)
</js-cell>

Just like reactive attributes, reactive child also accepts attributes such as `untilFirst`, `wrapper` & `sideEffects`.
More information can be found in [RxChild](@nav/api.RxChild) API documentation.

## RxChildren

The concept of reactive children involves a vDOM's entire list of children being bound to an observable.
Three policies are available:

- `append` : All children are appended at every emission of new items from `source$`.
- `replace` : All children are replaced each time a new item(s) is emitted by `source$`.
- `sync` : Synchronizes only the updated, new, or deleted children when `source$` emits a list of
  (usually immutable) data.

### Append Policy

The **`append`** uses a **`source$`** attribute that emits a list of new items, appending them to the existing
rendered elements using the **`vdomMap`** function, which takes one item and provides the associated
virtual DOM.

Here is an example that displays the 5 first random physicists (from `rndPhysicist$` previously defined):

<js-cell>
vDOM = {
    tag: 'div',
    class: 'd-flex flex-column',
    children:{
        policy: 'append',
        source$: rndPhysicist$.pipe(
            // append policy source$ requires a list of new data
            rxjs.map( p => [p]),
            // limit the stream to 5 data
            rxjs.take(5)
        ),
        vdomMap: physicistView,
        orderOperator: (a, b) => a.name.localeCompare(b.name)
    }
}    
display(vDOM)
</js-cell>

In this example, the optional **`orderOperator`** is provided to list the randomly picked items by their name
(in alphabetical order). If none is provided, items are appended in the order of emission from **`source$`**.

<note level='warning' label="Important">
For the **`orderOperator`** to take effect, the parent container should have a `display` style property set to either
`flex` or `grid`.
</note>

Additional information can be found in the [ChildrenOptionsAppend](@nav/api.ChildrenOptionsAppend)
API documentation.

### Replace Policy

The **`replace`** policy uses a **`source$`** attribute that emits any type of data (even though it is typically a
collection) and produces a list of Virtual DOMs through its **`vdomMap`** attribute.
When new views are produced by this function, all previously rendered elements are cleared and then the new
views appended.

<note level='warning' label='Performances'>
This policy is not performance-optimized, as the entire list of children is recreated with each emission of 
**`source$`**. In some cases, it is preferable to avoid recreating elements that remain unchanged between emissions.
The next **`sync`** policy addresses this scenario.
</note>

Here is an example:

<js-cell>
const buttonView = (title) => {
    const click$ = new rxjs.Subject()
    return {
        tag: 'div',
        class: 'btn btn-secondary',
        innerText: title,
        onclick: (ev) => click$.next(ev),
        click$
    }
}

const pickerBtn = buttonView("Pick 3 physicists")

const threeRndPhysicist$ = pickerBtn.click$.pipe(rxjs.map(()=> {
    let r = new Set()
    while(r.size<3){
        const index = Math.floor(Math.random() * physicists.length);
        r.add(physicists[index])
    }
    return Array.from(r)
    })
)
vDOM = {
    tag: 'div',
    class: 'd-flex flex-column',
    children:[
        pickerBtn,
        {
            tag:'div',
            class: 'd-flex flex-column',
            children: {
                policy: 'replace',
                source$: threeRndPhysicist$,
                vdomMap: (physicists) => physicists.map(physicistView),
            }
        }
    ]
}    
display(vDOM)
</js-cell>

<note level='info'>
Here, it is the responsibility of the caller to sort the items within the **`vdomMap`** function if needed.
There is no **`orderOperator`** attribute available.
</note>

Additional information can be found in the [ChildrenOptionsAppend](@nav/api.ChildrenOptionsReplace)
API documentation.

### Sync Policy

The **`sync`** policy takes a **`source$`** attribute that emit a list of items, refreshing the list of
rendered elements using the **`vdomMap`** function, which takes one item of the list and provides the associated
virtual DOM. When refreshing, the following actions take place:

- New HTML elements are created and added for the new domain data.
- HTML elements for domain data not present in the new list are removed.
- Remaining HTML elements are left unchanged, except for potential reordering within the parent container.

<js-cell>
vDOM = {
    tag: 'div',
    class: 'd-flex flex-column',
    children:[
        pickerBtn,
        {
            tag:'div',
            class: 'd-flex flex-column',
            children: {
                policy: 'sync',
                source$: threeRndPhysicist$,
                vdomMap: physicistView,
                orderOperator: (a, b) => a.name.localeCompare(b.name)
            }
        }
    ]
}
display(vDOM)

</js-cell>

The output is very similar to the previous example, with the following key differences:

- Only the changes between consecutive emissions are rendered. Identical elements between one emission of
  **`source$`** and the next are not re-rendered. By default, elements are compared using reference equality.
  You can provide a custom comparison function with the **`comparisonOperator`** attribute.
- The **`vdomMap`** function takes a single item from the list emitted by **`source$`** as its argument.
- The **`orderOperator`** option is available to control the display order, which is applicable only for flex or
  grid layouts.

Additional information can be found in the [ChildrenOptionsSync](@nav/api.ChildrenOptionsSync)
API documentation.

## HTMLElement & Lifecycle

In certain situations, such as when working with external libraries, it may be necessary to access the displayed
HTML element corresponding to a vDOM. Additionally, you might need to execute specific logic when the
HTMLElement is added to or removed from the page.

For such scenario, virtual DOMs can define the functions:

- **`connectedCallback`** : This function is executed when the HTMLElement is added to the page.
  It takes an [RxHTMLElement](@nav/api.RxHTMLElement) as an argument. This type implements the regular HTMLElement API
  for the corresponding tag and includes additional methods, such as **`ownSubscriptions`**, which allows you to
  bind RxJS subscriptions to the element's lifecycle (subscriptions will be unsubscribed when the element is removed
  from the page).
- **`disconnectedCallback`**: This function is executed when the HTMLElement is removed from the page.
  It also receives the associated element as an [RxHTMLElement](@nav/api.RxHTMLElement).
  This function is typically used to clean up resources.

The next snippet illustrates their usage by creating a reactive chart using
the <a target="_blank" href="https://www.chartjs.org/">Chart.js</a> library:

<js-cell >
const { chartJs } = await webpm.install({
    modules:['chart.js#^3.9.1 as chartJs'],
})
chartJs.Chart.register(...chartJs.registerables)

const rndPt = () => ({x:Math.random(), y:Math.random()})
const data$ = rxjs.timer(0,1000).pipe(
    rxjs.map(() => Array.from({length: 100}, rndPt))
)

// The 'plot' initialization requires the parent HTMLElement,
// available within the 'connectedCallback' function. 
// A reference is exposed here in order to execute resources cleaning  
// in the 'disconnectedCallback'.
let plot

vDOM = { 
    tag: 'div',
    class:`d-flex flex-column border text-center rounded p-2 h-100 w-100`,
    children: [
        {
            tag:'canvas',
            class:'mx-auto w-75',
            connectedCallback: (htmlElement) => {
                plot = new chartJs.Chart(
                    htmlElement, 
                    { 
                        type: 'scatter',
                        data: { datasets: [{label:'Rnd'}] }
                    }
                )
                const sub = data$.subscribe( (d) => {
                    plot.data.datasets[0].data = d
                    plot.update()
                })
                htmlElement.ownSubscriptions(sub)
            },
            disconnectedCallback: (htmlElement) =>  plot.clear()
        }
    ]
}
display(vDOM)
</js-cell>
