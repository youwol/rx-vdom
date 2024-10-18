import subprocess
from pathlib import Path

print("Generate TS API files")
doc_app_folder = Path(__file__).parent
lib_src_folder = doc_app_folder.parent
shell_command = (
    "node ./bin/index.js "
    f"--project {lib_src_folder} "
    "--nav /api "
    f"--out {doc_app_folder / 'assets' / 'api'}"
)
# Execute the shell command
subprocess.run(shell_command, shell=True, cwd="./node_modules/@youwol/mkdocs-ts",)