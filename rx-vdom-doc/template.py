import shutil
import subprocess
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import Template, PackageType, Dependencies, \
    RunTimeDeps, DevServer, Bundles, MainModule
from youwol.pipelines.pipeline_typescript_weback_npm.regular import generate_template
from youwol.utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / 'package.json')
pkg_json_rxvdom = parse_json(folder_path / '..' / 'package.json')
# (cd ./node_modules/@youwol/mkdocs-ts/bin/ && node index.js --project ../../../../.. --nav /api --out ../../../../assets/api)
externals_deps = {
    "@youwol/mkdocs-ts": "^0.5.0",
    "@youwol/rx-vdom": f"^{pkg_json_rxvdom['version'].replace('-wip', '')}",
    "@youwol/webpm-client": "^3.0.0",
    "rxjs": "^7.5.6"
}
in_bundle_deps = {}
dev_deps = {
    # This dependency is not required, it is to support ongoing work regarding a TS live editor to demonstrate
    # typing of VirtualDOM.
    "@youwol/rx-code-mirror-editors": "^0.5.0",
}

template = Template(
    path=folder_path,
    type=PackageType.APPLICATION,
    name=pkg_json['name'],
    version=pkg_json_rxvdom['version'],
    shortDescription=pkg_json['description'],
    author=pkg_json['author'],
    dependencies=Dependencies(
        runTime=RunTimeDeps(
            externals=externals_deps,
            includedInBundle=in_bundle_deps
        ),
        devTime=dev_deps
    ),
    bundles=Bundles(
         mainModule=MainModule(
             entryFile='./main.ts',
             loadDependencies=list(externals_deps.keys())
         )
    ),
    userGuide=True,
    devServer=DevServer(
        port=3027
    )
)

generate_template(template)
shutil.copyfile(
    src=folder_path / '.template' / 'src' / 'auto-generated.ts',
    dst=folder_path / 'src' / 'auto-generated.ts'
)
for file in ['README.md', '.gitignore', '.npmignore', '.prettierignore', 'LICENSE', 'package.json',
             'tsconfig.json', 'webpack.config.ts']:
    shutil.copyfile(
        src=folder_path / '.template' / file,
        dst=folder_path / file
    )


# Generate TS API files
print("Generate TS API files")
shell_command = (
    "cd ./node_modules/@youwol/mkdocs-ts && "
    "node ./bin/index.js "
    "--project ../../../.. "
    "--nav /api "
    "--out ../../assets/api"
)
# Execute the shell command
subprocess.run(shell_command, shell=True)

