import { TypescriptModule } from '@youwol/rx-code-mirror-editors'
import type { TsCodeEditorModule } from '@youwol/rx-code-mirror-editors'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { from } from 'rxjs'

function initTsEnvironment() {
    const files = [
        'api',
        'core',
        'factory',
        'rx-stream',
        'type-utils',
        'virtual-dom',
    ]
    const contents = Promise.all(
        files.map((file) => {
            return fetch(
                `/api/assets-gateway/cdn-backend/resources/QHlvdXdvbC9yeC12ZG9t/1.0.2-wip/dist/src/lib/${file}.d.ts`,
            ).then((resp) => {
                return resp
                    .text()
                    .then((content) => ({ path: `/${file}.ts`, content }))
            })
        }),
    )

    return Promise.all([TypescriptModule(), contents]).then(
        ([TsModule, files]) => {
            return { TsModule, files }
        },
    )
}
export class TsEditorView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({ tsSrc }: { tsSrc: string }) {
        initTsEnvironment()
        this.children = [
            {
                source$: from(initTsEnvironment()),
                vdomMap: ({
                    TsModule,
                    files,
                }: {
                    TsModule: TsCodeEditorModule
                    files
                }) => {
                    console.log('Files', files)
                    const state = new TsModule.IdeState({
                        files: [
                            {
                                path: './index.ts',
                                content: tsSrc,
                            },
                            ...files,
                            {
                                path: '@rxVDomConfig',
                                content: `
type AllTags = keyof HTMLElementTagNameMap

export type Configuration = {
    TypeCheck: 'strict'
    SupportedHTMLTags: AllTags
    WithFluxView: false
}
`,
                            },
                        ],
                    })
                    const view = new TsModule.CodeEditorView({
                        ideState: state,
                        path: './index.ts',
                        config: {},
                    })
                    return view
                },
            },
        ]
    }
}
