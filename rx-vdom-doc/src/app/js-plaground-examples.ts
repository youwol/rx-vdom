import { setup } from '../auto-generated'

export const example1 = `
<!DOCTYPE html>
<html lang="en">
    <head><script src="https://webpm.org/^3.0.0/webpm-client.js"></script></head>
    
    <body></body>    
    
    <script type="module">
        const { RxDom, rxjs } = await webpm.install({
            modules:[ 
                '@youwol/rx-vdom#${setup.version} as RxDom',
                'rxjs#^7.5.6 as rxjs'
            ],
            displayLoadingScreen: true
        })
        const vdom = {
            tag: 'div',
            innerText: { 
                source$: rxjs.timer(0,1000),
                vdomMap: () => \`👋 Current date is: \${new Date().toLocaleString()}\`
            }
        }
        document.body.append(RxDom.render(vdom))
        
    </script>
</html>
`
