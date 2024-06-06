
const runTimeDependencies = {
    "externals": {
        "@youwol/mkdocs-ts": "^0.5.0",
        "@youwol/rx-vdom": "^1.0.2",
        "@youwol/webpm-client": "^3.0.0",
        "rxjs": "^7.5.6"
    },
    "includedInBundle": {}
}
const externals = {
    "@youwol/mkdocs-ts": "window['@youwol/mkdocs-ts_APIv05']",
    "@youwol/mkdocs-ts/src/lib": "window['@youwol/mkdocs-ts_APIv05']['src']['lib']",
    "@youwol/mkdocs-ts/src/lib/code-api/models": "window['@youwol/mkdocs-ts_APIv05']['src']['lib']['code-api']['models']",
    "@youwol/rx-vdom": "window['@youwol/rx-vdom_APIv1']",
    "@youwol/webpm-client": "window['@youwol/webpm-client_APIv3']",
    "rxjs": "window['rxjs_APIv7']"
}
const exportedSymbols = {
    "@youwol/mkdocs-ts": {
        "apiKey": "05",
        "exportedSymbol": "@youwol/mkdocs-ts"
    },
    "@youwol/rx-vdom": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/rx-vdom"
    },
    "@youwol/webpm-client": {
        "apiKey": "3",
        "exportedSymbol": "@youwol/webpm-client"
    },
    "rxjs": {
        "apiKey": "7",
        "exportedSymbol": "rxjs"
    }
}

const mainEntry : {entryFile: string,loadDependencies:string[]} = {
    "entryFile": "./main.ts",
    "loadDependencies": [
        "@youwol/mkdocs-ts",
        "@youwol/rx-vdom",
        "@youwol/webpm-client",
        "rxjs"
    ]
}

const secondaryEntries : {[k:string]:{entryFile: string, name: string, loadDependencies:string[]}}= {}

const entries = {
     '@youwol/rx-vdom-doc': './main.ts',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@youwol/rx-vdom-doc/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@youwol/rx-vdom-doc',
        assetId:'QHlvdXdvbC9yeC12ZG9tLWRvYw==',
    version:'1.0.3-wip',
    shortDescription:"Documentation app for the library @youwol/rx-vdom",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/rx-vdom-doc&tab=doc',
    npmPackage:'https://www.npmjs.com/package/@youwol/rx-vdom-doc',
    sourceGithub:'https://github.com/youwol/rx-vdom-doc',
    userGuide:'https://l.youwol.com/doc/@youwol/rx-vdom-doc',
    apiVersion:'1',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
    secondaryEntries,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    },

    installMainModule: ({cdnClient, installParameters}:{
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const parameters = installParameters || {}
        const scripts = parameters.scripts || []
        const modules = [
            ...(parameters.modules || []),
            ...mainEntry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/rx-vdom-doc_APIv1`]
        })
    },
    installAuxiliaryModule: ({name, cdnClient, installParameters}:{
        name: string,
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const entry = secondaryEntries[name]
        if(!entry){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const parameters = installParameters || {}
        const scripts = [
            ...(parameters.scripts || []),
            `@youwol/rx-vdom-doc#1.0.3-wip~dist/@youwol/rx-vdom-doc/${entry.name}.js`
        ]
        const modules = [
            ...(parameters.modules || []),
            ...entry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/rx-vdom-doc/${entry.name}_APIv1`]
        })
    },
    getCdnDependencies(name?: string){
        if(name && !secondaryEntries[name]){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const deps = name ? secondaryEntries[name].loadDependencies : mainEntry.loadDependencies

        return deps.map( d => `${d}#${runTimeDependencies.externals[d]}`)
    }
}
