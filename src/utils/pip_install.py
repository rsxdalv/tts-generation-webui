import subprocess


def pip_install_wrapper(requirements, name):
    def fn():
        output = []
        for line in pip_install(requirements, name):
            output.append(line)
            yield "<br />".join(output)

    return fn


def pip_install(requirements, name):
    process = subprocess.Popen(
        f"pip install {requirements}",
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
    )

    # Stream the output to the console
    for line in process.stdout:  # type: ignore
        print(line, end="")
        yield line

    # Wait for the process to finish
    process.wait()

    # Check if the process was successful
    if process.returncode == 0:
        print(f"Successfully installed {name}")
        yield f"Successfully installed {name}, please restart the webui"
    else:
        print(f"Failed to install {name}")
        yield f"Failed to install {name}"
