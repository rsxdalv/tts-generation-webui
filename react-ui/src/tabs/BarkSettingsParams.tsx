import { updateLocalStorageWithFunction } from "../hooks/useLocalStorage";
import router from "next/router";

export const barkSettingsId = "barkSettingsParams";

export type BarkSettingsParams = {
  use_small_models: boolean;
  enable_mps: boolean;
  offload_gpu_models_to_cpu: boolean;

  text_generation_use_gpu: boolean;
  text_generation_use_small_model: boolean;
  coarse_to_fine_inference_use_gpu: boolean;
  coarse_to_fine_inference_use_small_model: boolean;
  fine_tuning_use_gpu: boolean;
  fine_tuning_use_small_model: boolean;
  use_gpu_codec: boolean;
  load_models_on_startup: boolean;
};

export const initialBarkSettingsParams: BarkSettingsParams = {
  use_small_models: false,
  enable_mps: false,
  offload_gpu_models_to_cpu: false,

  text_generation_use_gpu: false,
  text_generation_use_small_model: false,
  coarse_to_fine_inference_use_gpu: false,
  coarse_to_fine_inference_use_small_model: false,
  fine_tuning_use_gpu: false,
  fine_tuning_use_small_model: false,
  use_gpu_codec: false,
  load_models_on_startup: false,
};

export const sendToBarkSettings = (melody?: string) => {
  if (!melody) return;
  updateLocalStorageWithFunction(
    barkSettingsId,
    (barkSettingsParams: BarkSettingsParams = initialBarkSettingsParams) =>
      ({ ...barkSettingsParams, melody } as BarkSettingsParams)
  );
  router.push("/barkSettings");
};
