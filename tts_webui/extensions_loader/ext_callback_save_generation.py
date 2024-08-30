import sys
import numpy as np
from typing import Any, Dict
import os
import importlib
import traceback

callbacks_save_generation_musicgen = []
extensions_folder = os.path.join("extensions", "legacy")


def load_ext_callback_save_generation():
    print("Loading post generation extensions:")
    extension_files = os.listdir(extensions_folder)
    for file_name in extension_files:
        if file_name.endswith(".py"):
            module_name = file_name[:-3]
            try:
                spec = importlib.util.spec_from_file_location(
                    module_name, os.path.join(extensions_folder, file_name)
                )
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)

                callback_save_generation_musicgen = getattr(
                    module, "callback_save_generation_musicgen", None
                )

                if callback_save_generation_musicgen is not None:
                    callbacks_save_generation_musicgen.append(
                        callback_save_generation_musicgen
                    )
                print("  ", end="")
                print("Loaded extension:", module_name)
            except ImportError:
                print("  ", end="")
                print(f"Failed to import module: {module_name}")
                print("  ", end="")
                print("Error:", sys.exc_info()[0], sys.exc_info()[1])
                traceback.print_exc()
            except AttributeError:
                print("  ", end="")
                print(
                    f"Module {module_name} does not contain the function 'callback_save_generation'"
                )
    print("  ", end="")
    print(
        f"Loaded {len(callbacks_save_generation_musicgen)} callback_save_generation_musicgen extensions."
    )


def ext_callback_save_generation_musicgen(
    audio_array: np.ndarray,
    files: Dict[str, str],
    metadata: Dict[str, Any],
    SAMPLE_RATE: int,
) -> None:
    for callback in callbacks_save_generation_musicgen:
        try:
            callback(
                audio_array=audio_array,
                files=files,
                metadata=metadata,
                SAMPLE_RATE=SAMPLE_RATE,
            )
        except Exception as e:
            print("Error in callback_save_generation_musicgen extension:", e)
            traceback.print_exc()
