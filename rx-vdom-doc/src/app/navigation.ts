import {
    fromMarkdown,
    Views,
    installCodeApiModule,
    installNotebookModule,
} from '@youwol/mkdocs-ts'
import { setup } from '../auto-generated'
import { example1 } from './js-plaground-examples'
import { Router } from '@youwol/mkdocs-ts/src/lib'
import { map } from 'rxjs'
import { Module } from '@youwol/mkdocs-ts/src/lib/code-api/models'

const tableOfContent = Views.tocView

const project = {
    name: 'rx-vdom',
    docBasePath: `/api/assets-gateway/raw/package/${setup.assetId}/${setup.version}/assets/api`,
}

const url = (restOfPath: string) =>
    `/api/assets-gateway/raw/package/${setup.assetId}/${setup.version}/assets/${restOfPath}`

const placeholders = {
    '{{project}}': project.name,
    '{{rxvdom-version}}': setup.version,
    '{{URL-example-cdn}}': `/applications/@youwol/js-playground/latest?content=${encodeURIComponent(example1)}`,
}
function fromMd(file: string) {
    return fromMarkdown({
        url: url(file),
        placeholders,
    })
}
const CodeApiModule = await installCodeApiModule()
const NotebookModule = await installNotebookModule()
const notebookOptions = {
    runAtStart: true,
    defaultCellAttributes: {
        lineNumbers: false,
    },
    markdown: {
        latex: true,
        placeholders,
    },
}
await NotebookModule.SnippetEditorView.fetchCmDependencies$('javascript')

export const navigation = {
    name: 'Home',
    tableOfContent,
    decoration: {
        icon: {
            tag: 'i',
            class: 'fas fa-home mr-1',
        },
    },
    html: fromMd('index.md'),
    '/how-to': {
        name: 'How to',
        tableOfContent,
        html: fromMd('how-to.md'),
        '/install': {
            name: 'Install',
            tableOfContent,
            html: fromMd('how-to.install.md'),
        },
        '/typings': {
            name: 'Typings',
            tableOfContent,
            html: fromMd('how-to.typings.md'),
        },
    },
    '/tutorials': {
        name: 'Tutorials',
        tableOfContent,
        html: ({ router }) =>
            new NotebookModule.NotebookPage({
                url: url('tutorials.md'),
                router,
                options: notebookOptions,
            }),
        '/basics': {
            name: 'Getting started',
            tableOfContent,
            html: ({ router }) =>
                new NotebookModule.NotebookPage({
                    url: url('tutorials.basics.md'),
                    router,
                    options: notebookOptions,
                }),
        },
        '/todo': {
            name: 'ToDo app.',
            tableOfContent,
            html: ({ router }) =>
                new NotebookModule.NotebookPage({
                    url: url('tutorials.todo.md'),
                    router,
                    options: notebookOptions,
                }),
        },
    },
    '/api': {
        name: 'API',
        tableOfContent: (d: { html: HTMLElement; router: Router }) =>
            Views.tocView({ ...d, domConvertor: CodeApiModule.tocConvertor }),
        html: ({ router }) =>
            CodeApiModule.fetchModuleDoc({
                modulePath: project.name,
                basePath: project.docBasePath,
                configuration: CodeApiModule.configurationTsTypedoc,
                project,
            }).pipe(
                map((module: Module) => {
                    return new CodeApiModule.ModuleView({
                        module,
                        router,
                        configuration: CodeApiModule.configurationTsTypedoc,
                        project,
                    })
                }),
            ),
        '...': ({ path, router }: { path: string; router: Router }) =>
            CodeApiModule.docNavigation({
                modulePath: path,
                router,
                project,
                configuration: CodeApiModule.configurationTsTypedoc,
            }),
    },
}
