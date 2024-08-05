import json
import importlib
import importlib.util
from importlib.metadata import version
import time

import gradio as gr

from src.utils.pip_install import pip_install_wrapper
from src.utils.generic_error_tab_advanced import generic_error_tab_advanced


def check_if_package_installed(package_name):
    spec = importlib.util.find_spec(package_name)
    return spec is not None


def _handle_package(package_name, title_name, requirements):
    if check_if_package_installed(package_name):
        print(f"Loading {title_name} Extension...")
        start_time = time.time()
        try:
            module = importlib.import_module(f"{package_name}.main")
            if "builtin" in package_name:
                package_version = "0.0.1"
            else:
                package_version = version(package_name)
            main_tab = getattr(module, "extension__tts_generation_webui")
            with gr.Tab(f"{title_name} (v{package_version}) Extension"):
                if "builtin" in package_name:
                    gr.Markdown(f"{title_name} Extension is up to date")
                else:
                    if hasattr(module, "update_button"):
                        update_button = getattr(module, "update_button")
                        update_button()
                    else:
                        # universal update button
                        gr.Button("Attempt Update [May already be up to date]").click(
                            pip_install_wrapper(requirements, title_name),
                            outputs=[gr.HTML()],
                        )
                with gr.Tabs():
                    main_tab()
        except Exception as e:
            generic_error_tab_advanced(
                e, name=title_name + " Extension", requirements=requirements
            )
        finally:
            elapsed_time = time.time() - start_time
            print(f"{title_name} Extension loaded in {elapsed_time:.2f} seconds.")
    else:
        with gr.Tab(f"[Available] {title_name} Extension"):
            gr.Markdown(f"{title_name} Extension not installed")
            install_btn = gr.Button(f"Install {title_name} Extension")
            gr.Markdown("Installation console:")
            console_text = gr.HTML()
            install_btn.click(
                pip_install_wrapper(requirements, title_name),
                outputs=[console_text],
            )


def get_extension_list_json():
    try:
        return json.load(open("extensions.json"))["tabs"]
    except Exception as e:
        print("\n! Failed to load extensions.json:", e)
        return []


extension_list_json = get_extension_list_json()


def handle_extension_class(extension_class):
    for x in extension_list_json:
        if (
            x["extension_type"] == "interface"
            and x["extension_class"] == extension_class
        ):
            # x["package_name"], f"{x['name']} (v{x['version']})", x["requirements"]
            _handle_package(x["package_name"], x["name"], x["requirements"])


def extension_list_tab():
    with gr.Tab("Extensions List"):
        gr.Markdown("List of all extensions")
        table_string = """| Title | Description |\n| --- | --- |\n"""
        for x in extension_list_json:
            table_string += (
                # f"| {x['name']} (v{x['version']}) "
                f"| {x['name']} "
                + f"| {x['description']} (website: {x['website']}) (extension_website: {x['extension_website']}) |\n"
            )
        gr.Markdown(table_string)


if __name__ == "__main__":
    with gr.Blocks() as demo:

        handle_extension_class("audio-music-generation")
        handle_extension_class("audio-conversion")
        handle_extension_class("text-to-speech")

        demo.launch()
