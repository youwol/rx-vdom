# ToDo application

## Introduction

This page offers guidance on creating and structuring an application.
We'll explore the classic example of a to-do application:

<cell-output cell-id='final'>
</cell-output>

You can also find a similar version using the <a href="https://vuejs.org/" target="_blank">Vue</a> library
<a href='https://codesandbox.io/s/github/vuejs/vuejs.org/tree/master/src/v2/examples/vue-20-todomvc?from-embed'
   target='_blank'> here </a>, and a TypeScript version
<a href='https://github.com/youwol/todo-app-ts/' target='blank'> here</a>.

Let's begin by installing the necessary dependencies:
<js-cell>
const { rxDom, rxjs, httpClients } = await webpm.install({
    modules: [
        '@youwol/rx-vdom#1.0.2-wip as rxDom', 
        'rxjs#^7.5.6 as rxjs',
        '@youwol/http-clients as httpClients'
    ]
});
const storageClient =  new httpClients.CdnSessionsStorage.Client()
const {
    BehaviorSubject,
    skip,
    map,
    switchMap
} = rxjs
</js-cell>

<note level="info">
The HTTP client is utilized to store items in a storage solution hosted in the YouWol cloud. 
It's important to note that if you haven't registered with YouWol, there are no guarantees regarding the persistence
duration of the data.
</note>

## State

In **rx-vdom**, the state of the application (i.e. business logic) is typically managed through observables,
consumed at any point in time as **`source$`** observables by the vDOM.
This allows for a clear separation of concerns and helps to keep the code organized and easy to maintain.
When a change occurs in the state of the application, the relevant observables emit new values,
which in turn trigger automatic updates in the corresponding elements of views.

Regarding the todo application, the application state is presented below, description is provided using inlined
comments:

<js-cell>

const storageKey = {packageName:'@youwol/todo-app-js', dataName: 'todo-list'}

class State {
    constructor() {            
        // List of current todo items, each having 'id' (uid), 'name' & 'completed' properties 
        this.__items$ = new BehaviorSubject([])
        // The current filter: 'all' or 'completed' or 'active' (remaining)
        this.__filter$ = new BehaviorSubject('all')   
        // Readonly version of __items$
        this.items$ = this.__items$.asObservable()
        // Readonly version of __filter$
        this.filter$ = this.__filter$.asObservable()
        
        // Initial list of items retrieved from HTTP call
        storageClient.getData$(storageKey)
            .subscribe( (d) => this.__items$.next(d.items || []))
        
        // When __items$ emit new item's list, they are saved using HTTP call.
        this.items$.pipe(
            skip(1),
            switchMap( (items) =>
                storageClient.postData$({...storageKey, body:{ items }})
            )).subscribe()
        
        // Defines the 'completed$' observable from '__items$', 'true' if all items are done.
        this.completed$ = this.items$.pipe(
            map(items => items.reduce((acc, item) => acc && item.done, true))
        )
        // Defines the 'remaining$' observable from '__items$'
        this.remaining$ = this.items$.pipe(
            map(items => items.filter((item) => !item.done))
        )
        // Defines `filteredItem$` with respect to the current value of 'this.filter$'
        const fct = {
            all: () => true,
            active: (i) => !i.done,
            completed: (i) => i.done
        }
        this.filteredItem$ = rxjs.combineLatest(this.items$, this.filter$).pipe(
    	    map( ([items, filter]) => items.filter(fct[filter]))
        )
    }		
    toggleAll() {
        const completed = this.__items$.value.find( i => !i.done) == undefined
        const items = this.__items$.value.map(i => ({...i, done: !completed}))
        this.__items$.next(items)
    }
    addItem(name) {
        const item = { id: Date.now(), name, completed: false }
        this.__items$.next([...this.__items$.value, item])
    }
    deleteItem(id) {
        this.__items$.next(this.__items$.value.filter(item => item.id !== id))
    }		
    updateItem(id, properties){
        const items = this.__items$.value
            .map(item => item.id === id ? { ...item, ...properties } : item)
        this.__items$.next(items)
    }
    setFilter(filter) {
        this.__filter$.next(filter)
    }
}

const state = new State()
display(state)
</js-cell>

Key points regarding the **`State`** definition:

- It is independent of the views and does not consume any **`rx-vdom`** symbols.
  This promotes a clean separation of concerns, making the codebase easier to understand, maintain and test.
- The state data is treated as immutable. Instead of directly modifying the state, methods like **`toggleAll`**,
  **`addItem`**, **`deleteItem`**, and **`updateItem`** create new copies of the state with the desired modifications
  and emit them through the **`__items$`** subject. This helps in avoiding unintended side effects and simplifies
  reasoning about state changes.

With the application logic defined, let's proceed to designing the views.

## Views

### 'REPL' View

To kick things off, let's create a preliminary application that showcases the items as JSON objects.
The colors of these items will vary based on their status. Additionally, we'll enable interaction with the application
state, resembling a REPL (Read-Eval-Print Loop) user experience, leveraging the **`state`** symbol.

<js-cell>
const titleView = (title) => ({
    tag:'div', innerText: title, class:'text-info'
})
const jsonItemView = (item) => ({
    tag: 'div',
    innerText: JSON.stringify(item),
    class: item.done ? 'text-success' : ''
})
const jsonItemsView = (items$)=>({
    tag: 'div',
    children: {
        policy: 'replace',
        source$: items$,
        vdomMap: (items) => items.map(jsonItemView)
    }
})
const replInputView = (state)=> ({
     tag:'input', class:'w-100', placeholder: "state.toggleAll()",
     onkeypress: (ev) => {
         ev.key == 'Enter' && new Function('state', ev.target.value)(state)
     }
})
let vDOM = {
    tag: 'div',
	children: [            
        titleView('Items'), 
        jsonItemsView(state.items$),
        titleView('Repl'), 
        replInputView(state)
    ]
}
display(vDOM)
</js-cell>

Here are a few examples of valid REPL expressions that can be entered:

- **`state.toggleAll()`** (Toggles the completion status of all items)
- **`state.addItem('foo')`** (Adds a new item with the name 'foo')

### Items View

Below are the definitions for displaying the list of items. Each item can be checked or unchecked,
its name can be modified (by double-clicking on it), and it can be deleted:

<js-cell>
const itemsView = (state) => ({
    class:'d-flex flex-column',
	children: {
        policy: 'sync',
        source$: state.filteredItem$,
        vdomMap: (item) => itemView(item, state),
        orderOperator: (a,b) => a.id - b.id
    }
})
const itemView = ( item, state ) => {
    const edited$ = new rxjs.BehaviorSubject(false)
	const child$ = {
        source$: edited$, 
        vdomMap: (m) => m ? editView(item, state) : normalView(item, edited$), 
        sideEffects: (rxElem) => rxElem.element.focus()
    }
    return {
        tag:'header',
        class:'d-flex align-items-center justify-content-between item-view',
        children: [checkerView(item, state), child$, trashView(item, state)]
    }
}
const editView = (item, state)=>({
	tag: 'input', type: 'text', onclick: (ev) => ev.stopPropagation(),
    onkeypress: (e) => { 
        if(e.key=="Enter"){
        	e.target.onblur = () => {}
            state.updateItem( item.id, {name:e.target.value})
        }},
    onblur: (e) => state.updateItem(item.id, {name:e.target.value})
})

const normalView = (item, edited$) => ({
    tag:'span', innerText: item.name, 
    class: `item-pres ${item.done ? 'text-muted' : 'text-dark'}`,
    style: { 'text-decoration': item.done ? 'line-through' : ''},
    ondblclick: () => edited$.next(true)
})

const checkerView = ( item, state ) => ({
    tag: 'div',
    class: `border rounded-circle m-2 bg-light fv-pointer`,
    style:{ width: '30px', height: '30px'},
    onclick: () => state.updateItem( item.id, {done: !item.done}),
    children: [{ class: item.done ? 'fas fa-check w-100 text-center text-success' : '' }]
})

const trashView = (item, state) => ({
	tag:'i', class:'delete fas fa-times text-danger float-right px-3 fv-pointer',
    onclick: () => state.deleteItem(item.id)
})

vDOM = {
    tag: 'div',
    class:'rounded h-100 bg-light mx-auto',
    children: [
        itemsView(state)
    ]
}

display(vDOM)

</js-cell>

### Header View

Below is the implementation of the header view, which allows users to add new items and provides a toggle button
to mark all items as done or not done:

<js-cell>

const headerView = (state) => ({
    tag:'header', class: 'header d-flex align-items-center mx-auto',
    children:[ toggleAllView(state), newTaskView(state) ]
})
const toggleAllView = (state) => {
    const base = 'fas fa-chevron-down p-2 text-secondary fv-pointer'
    const f = { true:base+' text-dark', false: base+' text-disabled' }
    return {
        tag: 'i', 
        class: {
        	source$: state.completed$,
            vdomMap: (completed) => f[completed]
        },
        onclick: () => state.toggleAll() 
	}
}

const newTaskView = (state) => ({
    tag: 'input', autofocus: 'autofocus', autocomplete: 'off',
    placeholder: "What needs to be done?", class: 'new-todo',
    onkeypress: (ev) => { 
        if(ev.key === "Enter") {
            state.addItem(ev.target.value)  
            ev.target.value = ""
        }
    }
})

vDOM = {
    tag:'div',
    class:'rounded p-2 w-100 fv-bg-primary',
    children: [{
        tag: 'div',
        class: 'todo-app d-flex flex-column justify-content-center',
        children: [ 
            headerView(state), 
            itemsView(state) 
        ]
    }]
}

display(vDOM)

</js-cell>

### Final view

To complete the application, let's add a footer:

<js-cell>

const footerView = (state) => ({
    tag: 'div',
	class:'d-flex align-items-center px-3 border-top py-2 text-secondary',
	children:[remainingView(state), selectorsView(state)]
})
const remainingView = (state) => ({
	tag: 'span',
    innerText: {
        source$: state.remaining$, 
        vdomMap: (items) => items.length, 
        wrapper: (d) => `${d} item${d > 1 ? 's' : ''} left`
	}
})
const selectorsView = (state) => ({
    tag: 'div',
    class:'d-flex align-items-center mx-2 p-1 border ',
	children:  ['all', 'active', 'completed']
    	.map( name => filterView(state, name))
})
const filterView = (state, name) => ({
    tag: 'div',
    innerText:name,
    class: {
        source$: state.filter$,
        vdomMap: (mode) => mode==name ? 'fv-text-focus': '',
        wrapper: (d) => `${d} mx-2 fv-pointer `
    },
    onclick: () => state.setFilter(name)
})
vDOM = {
    tag:'div',
    class:'rounded p-2 w-100 fv-bg-primary',
    children: [
        {
            tag: 'div',
            class: 'todo-app d-flex flex-column justify-content-center',
            children: [ 
                headerView(state), 
                itemsView(state), 
                footerView(state) 
            ]
	    }
    ]
}

display(vDOM)
</js-cell>

The next cell simply display the final view at the top of the page:
<js-cell cell-id="final">
display(vDOM)
</js-cell>
