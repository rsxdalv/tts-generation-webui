import useLocalStorage, {
  updateLocalStorageWithFunction,
} from "../hooks/useLocalStorage";
import router from "next/router";

export type RVCParams = {
  pitch_up_key: string; // string  in 'Pitch Up key' Textbox component
  original_audio: string; // string  in 'Original Audio' Audio component
  index: string; // string  in 'Index' File component
  pitch_collection_method: string; // string (Option from: ['harvest', 'reaper', 'melodia']) in 'Pitch Collection Method' Radio component
  model: string; // string  in 'Model' File component
  search_feature_ratio: number; // number (numeric value between 0.0 and 1.0) in 'Search Feature Ratio' Slider component
  device: string; // string (Option from: ['cuda:0', 'cpu', 'mps']) in 'Device' Dropdown component
  use_half_precision_model: boolean; // boolean  in 'Use half precision model (Depends on GPU support)' Checkbox component
  filter_radius_pitch: number; // number (numeric value between 0 and 10) in 'Filter Radius (Pitch)' Slider component
  resample_sample_rate_bug: number; // number (numeric value between 0 and 48000) in 'Resample Sample-rate (Bug)' Slider component
  voice_envelope_normalizaiton: number; // number (numeric value between 0.0 and 1.0) in 'Voice Envelope Normalizaiton' Slider component
  protect_breath_sounds: number; // number (numeric value between 0.0 and 0.5) in 'Protect Breath Sounds' Slider component
};

export const initialState: RVCParams = {
  pitch_up_key: "0", // string  in 'Pitch Up key' Textbox component
  original_audio: "", // string  in 'Original Audio' Audio component
  index: "", // string  in 'Index' File component
  pitch_collection_method: "harvest", // string (Option from: ['harvest', 'reaper', 'melodia']) in 'Pitch Collection Method' Radio component
  model: "", // string  in 'Model' File component
  search_feature_ratio: 0.66, // number (numeric value between 0.0 and 1.0) in 'Search Feature Ratio' Slider component
  device: "cuda:0", // string (Option from: ['cuda:0', 'cpu', 'mps']) in 'Device' Dropdown component
  use_half_precision_model: false, // boolean  in 'Use half precision model (Depends on GPU support)' Checkbox component
  filter_radius_pitch: 3, // number (numeric value between 0 and 10) in 'Filter Radius (Pitch)' Slider component
  resample_sample_rate_bug: 0, // number (numeric value between 0 and 48000) in 'Resample Sample-rate (Bug)' Slider component
  voice_envelope_normalizaiton: 1, // number (numeric value between 0.0 and 1.0) in 'Voice Envelope Normalizaiton' Slider component
  protect_breath_sounds: 0.33, // number (numeric value between 0.0 and 0.5) in 'Protect Breath Sounds' Slider component
};

export const RVCId = "rvc_generation-tab";

export const sendToRVCGeneration = (audio?: string) => {
  if (!audio) return;
  updateLocalStorageWithFunction(
    RVCId,
    (vocosParams: RVCParams = initialState) =>
      ({ ...vocosParams, audio } as RVCParams)
  );
  router.push("/bark");
};

export const useRVCGenerationParams = () =>
  useLocalStorage<RVCParams>(RVCId, initialState);
