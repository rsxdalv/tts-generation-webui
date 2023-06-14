from typing import Any, Callable, Dict, List
import gradio as gr


def settings_tab_gradio(
    save_config: Callable[[List[str], List[Any]], str],
    reload_config_and_restart_ui: Callable[[], None],
    gradio_interface_options: Dict[str, Any],
):
    with gr.Tab("Settings (Gradio)"):
        with gr.Row():
            with gr.Column():
                # inline: whether to display in the interface inline in an iframe. Defaults to True in python notebooks; False otherwise.
                # inbrowser: whether to automatically launch the interface in a new tab on the default browser.
                # share: whether to create a publicly shareable link for the interface. Creates an SSH tunnel to make your UI accessible from anywhere. If not provided, it is set to False by default every time, except when running in Google Colab. When localhost is not accessible (e.g. Google Colab), setting share=False is not supported.
                # debug: if True, blocks the main thread from running. If running in Google Colab, this is needed to print the errors in the cell output.
                # auth: If provided, username and password (or list of username-password tuples) required to access interface. Can also provide function that takes username and password and returns True if valid login.
                # auth_message: If provided, HTML message provided on login page.
                # prevent_thread_lock: If True, the interface will block the main thread while the server is running.
                # show_error: If True, any errors in the interface will be displayed in an alert modal and printed in the browser console log
                # server_port: will start gradio app on this port (if available). Can be set by environment variable GRADIO_SERVER_PORT. If None, will search for an available port starting at 7860.
                # server_name: to make app accessible on local network, set this to "0.0.0.0". Can be set by environment variable GRADIO_SERVER_NAME. If None, will use "127.0.0.1".
                # show_tips: if True, will occasionally show tips about new Gradio features
                # enable_queue: DEPRECATED (use .queue() method instead.) if True, inference requests will be served through a queue instead of with parallel threads. Required for longer inference times (> 1min) to prevent timeout. The default option in HuggingFace Spaces is True. The default option elsewhere is False.
                # max_threads: the maximum number of total threads that the Gradio app can generate in parallel. The default is inherited from the starlette library (currently 40). Applies whether the queue is enabled or not. But if queuing is enabled, this parameter is increaseed to be at least the concurrency_count of the queue.
                # width: The width in pixels of the iframe element containing the interface (used if inline=True)
                # height: The height in pixels of the iframe element containing the interface (used if inline=True)
                # encrypt: DEPRECATED. Has no effect.
                # favicon_path: If a path to a file (.png, .gif, or .ico) is provided, it will be used as the favicon for the web page.
                # ssl_keyfile: If a path to a file is provided, will use this as the private key file to create a local server running on https.
                # ssl_certfile: If a path to a file is provided, will use this as the signed certificate for https. Needs to be provided if ssl_keyfile is provided.
                # ssl_keyfile_password: If a password is provided, will use this with the ssl certificate for https.
                # ssl_verify: If False, skips certificate validation which allows self-signed certificates to be used.
                # quiet: If True, suppresses most print statements.
                # show_api: If True, shows the api docs in the footer of the app. Default True. If the queue is enabled, then api_open parameter of .queue() will determine if the api docs are shown, independent of the value of show_api.
                # file_directories: List of directories that gradio is allowed to serve files from (in addition to the directory containing the gradio python file). Must be absolute paths. Warning: any files in these directories or its children are potentially accessible to all users of your app.

                gradio_interface_options_ui: Dict[
                    str, gr.Checkbox | gr.Slider | gr.Textbox
                ] = {
                    "inline": gr.Checkbox(
                        label="inline: Display inline in an iframe",
                        value=gradio_interface_options["inline"],
                    ),
                    "inbrowser": gr.Checkbox(
                        label="inbrowser: Automatically launch in a new tab",
                        value=gradio_interface_options["inbrowser"],
                    ),
                    "share": gr.Checkbox(
                        label="share: Create a publicly shareable link",
                        value=gradio_interface_options["share"],
                    ),
                    "debug": gr.Checkbox(
                        label="debug: Block the main thread from running",
                        value=gradio_interface_options["debug"],
                    ),
                    "enable_queue": gr.Checkbox(
                        label="enable_queue: Serve inference requests through a queue",
                        value=gradio_interface_options["enable_queue"],
                    ),
                    "max_threads": gr.Slider(
                        minimum=1,
                        maximum=100,
                        step=1,
                        label="max_threads: Maximum number of total threads",
                        value=gradio_interface_options["max_threads"],
                    ),
                    "auth": gr.Textbox(
                        label="auth: Username and password required to access interface, username:password",
                        value=gradio_interface_options["auth"],
                    ),
                    "auth_message": gr.Textbox(
                        label="auth_message: HTML message provided on login page",
                        value=gradio_interface_options["auth_message"],
                    ),
                    "prevent_thread_lock": gr.Checkbox(
                        label="prevent_thread_lock: Block the main thread while the server is running",
                        value=gradio_interface_options["prevent_thread_lock"],
                    ),
                    "show_error": gr.Checkbox(
                        label="show_error: Display errors in an alert modal",
                        value=gradio_interface_options["show_error"],
                    ),
                    "server_name": gr.Textbox(
                        label="server_name: Make app accessible on local network",
                        value=gradio_interface_options["server_name"],
                    ),
                    "server_port": gr.Textbox(
                        label="server_port: Start gradio app on this port",
                        value=gradio_interface_options["server_port"],
                    ),
                    "show_tips": gr.Checkbox(
                        label="show_tips: Show tips about new Gradio features",
                        value=gradio_interface_options["show_tips"],
                    ),
                    "height": gr.Slider(
                        minimum=100,
                        maximum=1000,
                        step=10,
                        label="height: Height in pixels of the iframe element",
                        value=gradio_interface_options["height"],
                    ),
                    "width": gr.Slider(
                        minimum=100,
                        maximum=1000,
                        step=10,
                        label="width: Width in pixels of the iframe element",
                        value=gradio_interface_options["width"],
                    ),
                    "favicon_path": gr.Textbox(
                        label="favicon_path: Path to a file (.png, .gif, or .ico) to use as the favicon",
                        value=gradio_interface_options["favicon_path"],
                    ),
                    "ssl_keyfile": gr.Textbox(
                        label="ssl_keyfile: Path to a file to use as the private key file to create a local server "
                        "running on https",
                        value=gradio_interface_options["ssl_keyfile"],
                    ),
                    "ssl_certfile": gr.Textbox(
                        label="ssl_certfile: Path to a file to use as the signed certificate for https",
                        value=gradio_interface_options["ssl_certfile"],
                    ),
                    "ssl_keyfile_password": gr.Textbox(
                        label="ssl_keyfile_password: Password to use with the ssl certificate for https",
                        value=gradio_interface_options["ssl_keyfile_password"],
                    ),
                    "ssl_verify": gr.Checkbox(
                        label="ssl_verify: Skip certificate validation",
                        value=gradio_interface_options["ssl_verify"],
                    ),
                    "quiet": gr.Checkbox(
                        label="quiet: Suppress most print statements",
                        value=gradio_interface_options["quiet"],
                    ),
                    "show_api": gr.Checkbox(
                        label="show_api: Show the api docs in the footer of the app",
                        value=gradio_interface_options["show_api"],
                    ),
                    "file_directories": gr.Textbox(
                        label="file_directories: List of directories that gradio is allowed to serve files from",
                        value=gradio_interface_options["file_directories"],
                    ),
                    "_frontend": gr.Checkbox(
                        label="_frontend: Frontend",
                        value=gradio_interface_options["_frontend"],
                    ),
                }

                # Create an input list of all UI elements
                inputs = list(gradio_interface_options_ui.values())
                keys = list(gradio_interface_options_ui)

                save_beacon = gr.Markdown("")

                # Map over the UI elements
                for i in inputs:
                    i.change(
                        fn=lambda *input_values: save_config(keys, input_values),
                        inputs=inputs,
                        outputs=[save_beacon],
                    )

                reload_config_and_restart_ui_button = gr.Button(
                    # value="Reload config and restart UI",
                    value="Apply settings and shutdown UI (Manual Restart Required)"
                )

                reload_config_and_restart_ui_button.click(
                    fn=reload_config_and_restart_ui, _js="window.location.reload();"
                )
