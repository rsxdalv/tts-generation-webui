import json
import importlib
import importlib.util
from importlib.metadata import version
import time

import gradio as gr

from src.utils.pip_install import pip_install_wrapper, pip_uninstall_wrapper
from src.utils.generic_error_tab_advanced import generic_error_tab_advanced


def check_if_package_installed(package_name):
    spec = importlib.util.find_spec(package_name)
    return spec is not None


disabled_extensions = ["decorator_disabled"]


def get_extension_list_json():
    try:
        return json.load(open("extensions.json"))["decorators"]
    except Exception as e:
        print("\n! Failed to load extensions.json:", e)
        return []


extension_list_json = get_extension_list_json()


def extension_decorator_list_tab():
    with gr.Tab("Decorator Extensions List"):
        gr.Markdown("List of all extensions")
        table_string = """| Title | Description |\n| --- | --- |\n"""
        for x in extension_list_json:
            table_string += (
                # f"| {x['name']} (v{x['version']}) "
                f"| {x['name']} "
                + f"| {x['description']} (website: {x['website']}) (extension_website: {x['extension_website']}) |\n"
            )
        gr.Markdown(table_string)

        external_extension_list = [
            x for x in extension_list_json if "builtin" not in x["package_name"]
        ]

        with gr.Row():
            with gr.Column():
                gr.Markdown("Install/Uninstall Extensions")

                install_dropdown = gr.Dropdown(
                    label="Select Extension to Install",
                    choices=[x["package_name"] for x in external_extension_list],
                )

                install_button = gr.Button("Install extension")

                def install_extension(package_name):
                    yield from pip_install_wrapper(package_name, package_name)()

                install_button.click(
                    fn=install_extension,
                    inputs=[install_dropdown],
                    outputs=[gr.HTML()],
                    api_name="install_extension",
                )

            with gr.Column():
                gr.Markdown("Uninstall Extensions")
                uninstall_dropdown = gr.Dropdown(
                    label="Select Extension to Uninstall",
                    choices=[x["package_name"] for x in external_extension_list],
                )
                uninstall_button = gr.Button("Uninstall extension")

                def uninstall_extension(package_name):
                    yield from pip_uninstall_wrapper(package_name, package_name)()

                uninstall_button.click(
                    fn=uninstall_extension,
                    inputs=[uninstall_dropdown],
                    outputs=[gr.HTML()],
                    api_name="uninstall_extension",
                )


def _load_decorators(class_name):
    wrappers = []
    for x in extension_list_json:
        if x["extension_type"] == "decorator" and x["extension_class"] == class_name:
            print(f"Loading decorator extension {x['name']}")
            start_time = time.time()
            try:
                module = importlib.import_module(f"{x['package_name']}.main")
                for name in dir(module):
                    if name.startswith("decorator_"):
                        if name in disabled_extensions:
                            print(f"  Skipping disabled decorator extension {name}")
                            continue
                        wrappers.append(getattr(module, name))
                        print(f"  Decorator {name} loaded")
            except Exception as e:
                print(f"Failed to load decorator extension {x['name']}: {e}")
            finally:
                elapsed_time = time.time() - start_time
                print(
                    f"Decorator extension {x['name']} loaded in {elapsed_time:.2f} seconds."
                )
    return wrappers


OUTER_WRAPPERS = _load_decorators("outer")
INNER_WRAPPERS = _load_decorators("inner")


def decorator_extension_outer(fn0):
    return _decorator_extension(OUTER_WRAPPERS, fn0)


def decorator_extension_inner(fn0):
    return _decorator_extension(INNER_WRAPPERS, fn0)


def _decorator_extension(wrappers, fn0):
    wrappers.reverse()
    for wrapper in wrappers:
        fn0 = wrapper(fn0)
    return fn0


if __name__ == "__main__":
    pass
