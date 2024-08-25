presets = {
    "ultra_fast": {
        "num_autoregressive_samples": 16,
        "diffusion_iterations": 30,
        "cond_free": False,
    },
    "fast": {
        "num_autoregressive_samples": 96,
        "diffusion_iterations": 80,
    },
    "standard": {
        "num_autoregressive_samples": 256,
        "diffusion_iterations": 200,
    },
    "high_quality": {
        "num_autoregressive_samples": 256,
        "diffusion_iterations": 400,
    },
}
