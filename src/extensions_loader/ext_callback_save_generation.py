from src.bark.FullGeneration import FullGeneration
from .CallbackSaveGeneration import CallbackSaveGeneration
import sys
import numpy as np
from typing import Any, Dict, List
import os
import importlib

# callbacks_save_generation: List[CallbackSaveGeneration] = [
# ]
callbacks_save_generation = []
callbacks_save_generation_musicgen = []
extensions_folder = os.path.join(os.path.dirname(__file__), "extensions")

# Get the list of files in the extensions folder
print("Loading extensions:")
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

            # Retrieve the function from the module
            callback_save_generation = getattr(module, "callback_save_generation", None)

            if callback_save_generation is not None:
                callbacks_save_generation.append(callback_save_generation)

            callback_save_generation_musicgen = getattr(
                module, "callback_save_generation_musicgen", None
            )

            if callback_save_generation_musicgen is not None:
                callbacks_save_generation_musicgen.append(
                    callback_save_generation_musicgen
                )
            print("Loaded extension:", module_name)
        except ImportError:
            print(f"Failed to import module: {module_name}")
            print("Error:", sys.exc_info()[0], sys.exc_info()[1])
        except AttributeError:
            print(
                f"Module {module_name} does not contain the function 'callback_save_generation'"
            )

# print(f"Loaded {len(callbacks_save_generation)} extensions.")
print(f"Loaded {len(callbacks_save_generation)} callback_save_generation extensions.")
print(
    f"Loaded {len(callbacks_save_generation_musicgen)} callback_save_generation_musicgen extensions."
)


def ext_callback_save_generation(
    full_generation: FullGeneration,
    # full_generation: Dict[str, Any],
    audio_array: np.ndarray,
    files: Dict[str, str],
    metadata: Dict[str, Any],
) -> None:
    for callback in callbacks_save_generation:
        try:
            callback(
                full_generation=full_generation,
                audio_array=audio_array,
                files=files,
                metadata=metadata,
            )
        except Exception as e:
            print("Error in callback_save_generation extension:", e)


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


if __name__ == "__main__":
    print("Testing extensions_loader.py")
    print("callbacks_save_generation:", callbacks_save_generation)
    print("ext_callback_save_generation:", ext_callback_save_generation)
    print("Done testing extensions_loader.py")

    # Test the extensions
    ext_callback_save_generation(
        full_generation={
            "semantic_prompt": np.array([1, 2, 3]),
            "coarse_prompt": np.array([1, 2, 3]),
            "fine_prompt": np.array([1, 2, 3]),
        },
        audio_array=np.array([1, 2, 3]),
        files={"ogg": "sample.ogg"},
        metadata={"extension": "test"},
    )
