# Installation

## From npm

You can install the library using npm:

```shell
npm install @youwol/mkdocs-ts
```

Or using yarn:

```shell
yarn add @youwol/mkdocs-ts
```

## From CDN

For a standalone example using a CDN, click <a href="{{URL-example-cdn}}" target="_blank">here</a>.

# TypeScript Setup

To use @youwol/rx-vdom in a TypeScript environment, create a `rx-vdom-config.ts` file at the root of your project
(next to `tsconfig.json`). Here’s a typical configuration:

<code-snippet language="javascript">
// For dev-mode change the following definition by anything else (e.g. type Mode = 'Dev')
type Mode = 'Prod'

type AllTags = keyof HTMLElementTagNameMap
// If Mode is not 'Prod', the next type union should include the tags used by your project.
// It speeds up compilation time (only used HTML tags are considered, not the whole list defined by AllTags).
type DevTags = 'div' // | 'span' | 'i' | 'h1' | ...

export type Configuration = {
TypeCheck: 'strict'
SupportedHTMLTags: Mode extends 'Prod' ? AllTags : DevTags
}

</code-snippet>

This file helps control TypeScript compilation time for regarding **rx-vdom** elements.

You also need to reference the path of this file in your `tsconfig.json` file as follows:

<code-snippet language="javascript">
{
    "compilerOptions": {
        "paths": {
            "@rxVDomConfig": ["./rx-vdom-config"]
        }
    }
}
</code-snippet>

For more details or if you encounter compilation issues, visit the [typings](@nav/how-to/typings) page.
