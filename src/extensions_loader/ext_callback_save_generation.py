from ..bark.FullGeneration import FullGeneration
from .CallbackSaveGeneration import CallbackSaveGeneration
import sys
import numpy as np
from typing import Any, Dict, List
import os
import importlib

# callbacks_save_generation: List[CallbackSaveGeneration] = [
# ]
callbacks_save_generation = []
extensions_folder = os.path.join(os.path.dirname(__file__), 'extensions')

# Get the list of files in the extensions folder
print("Loading extensions:")
extension_files = os.listdir(extensions_folder)
for file_name in extension_files:
    if file_name.endswith('.py'):
        module_name = file_name[:-3]
        try:
            spec = importlib.util.spec_from_file_location(module_name, os.path.join(extensions_folder, file_name))
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            # Retrieve the function from the module
            callback_save_generation = getattr(
                module, 'callback_save_generation')

            callbacks_save_generation.append(callback_save_generation)
            print("Loaded extension:", module_name)
        except ImportError:
            print(f"Failed to import module: {module_name}")
            print("Error:", sys.exc_info()[0], sys.exc_info()[1])
        except AttributeError:
            print(
                f"Module {module_name} does not contain the function 'callback_save_generation'")

print(f"Loaded {len(callbacks_save_generation)} extensions.")


def ext_callback_save_generation(
        full_generation: FullGeneration,
        # full_generation: Dict[str, Any],
        audio_array: np.ndarray,
        files: Dict[str, str],
        metadata: Dict[str, Any]
) -> None:
    for callback in callbacks_save_generation:
        callback(full_generation, audio_array, files, metadata)


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
        metadata={"extension": "test"}
    )
