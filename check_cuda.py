import torch

# Set this to "True" to force no repair
FORCE_NO_REPAIR = False


def check_if_torch_has_cuda():
    """Check if torch has CUDA available"""
    if FORCE_NO_REPAIR:
        print("Forcing no torch repair")
        return True
    try:
        if torch.cuda.is_available():
            return True
        else:
            raise Exception("")
    except Exception as e:
        print("Torch does not have CUDA")
        print(e)
        exit(1)  # set return code to 1


check_if_torch_has_cuda()
