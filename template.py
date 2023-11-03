import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import (
    Template,
    PackageType,
    Dependencies,
    RunTimeDeps,
    Bundles,
    MainModule,
)
from youwol.pipelines.pipeline_typescript_weback_npm.regular import generate_template
from youwol.utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / "package.json")

externals_deps = {"rxjs": "^7.5.6"}
in_bundle_deps = {
    # polyfill for WebKt based browsers (e.g. Safari)
    # see https://github.com/WebKit/standards-positions/issues/97
    "@ungap/custom-elements": "1.2.0"
}
dev_deps = {
    # `conditional-type-checks` is used to realize 'compile time' tests on type definitions
    "conditional-type-checks": "^1.0.6",
    "typedoc-plugin-mdn-links": "^3.1.0",
    "rxjs-spy": "^8.0.2",
}

template = Template(
    path=folder_path,
    type=PackageType.Library,
    name=pkg_json["name"],
    version=pkg_json["version"],
    shortDescription=pkg_json["description"],
    author=pkg_json["author"],
    dependencies=Dependencies(
        runTime=RunTimeDeps(externals=externals_deps, includedInBundle=in_bundle_deps),
        devTime=dev_deps,
    ),
    bundles=Bundles(
        mainModule=MainModule(
            entryFile="./index.ts",
            loadDependencies=list(externals_deps.keys()),
            aliases=[],
        )
    ),
    userGuide=True,
)

generate_template(template)
shutil.copyfile(
    src=folder_path / ".template" / "src" / "auto-generated.ts",
    dst=folder_path / "src" / "auto-generated.ts",
)
for file in [
    "README.md",
    ".gitignore",
    ".npmignore",
    ".prettierignore",
    "LICENSE",
    "package.json",
    "tsconfig.json",
    "jest.config.ts",
    "webpack.config.ts",
]:
    shutil.copyfile(src=folder_path / ".template" / file, dst=folder_path / file)
