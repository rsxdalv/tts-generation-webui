import { updateLocalStorageWithFunction } from "../hooks/useLocalStorage";
import router from "next/router";

export type TortoiseGenerationParams = {
  prompt: string; // string  in 'Prompt' Textbox component
  speaker: string; // string (Option from: ['random', 'angie', 'applejack', 'cond_latent_example', 'daniel', 'deniro', 'emma', 'freeman', 'geralt', 'halle', 'jlaw', 'lj', 'mol', 'myself', 'pat', 'pat2', 'rainbow', 'snakes', 'tim_reynolds', 'tom', 'train_atkins', 'train_daws', 'train_dotrice', 'train_dreams', 'train_empire', 'train_grace', 'train_kennard', 'train_lescault', 'train_mouse', 'weaver', 'william', 'freeman_2a', 'freeman_3', 'pat4']) in 'parameter_2502' Dropdown component
  preset: string; // string (Option from: ['ultra_fast', 'fast', 'standard', 'high_quality']) in 'parameter_2507' Dropdown component
  seed: number; // number  in 'parameter_2521' Number component
  cvvp_amount: number; // number (numeric value between 0.0 and 1.0) in 'CVVP Amount' Slider component
  split_prompt: boolean; // boolean  in 'Split prompt by lines' Checkbox component
  samples: number; // number (numeric value between 4 and 256) in 'Samples' Slider component
  diffusion_iterations: number; // number (numeric value between 4 and 400) in 'Diffusion Iterations' Slider component
  temperature: number; // number (numeric value between 0.0 and 1.0) in 'Temperature' Slider component
  length_penalty: number; // number (numeric value between 0.0 and 10.0) in 'Length Penalty' Slider component
  repetition_penalty: number; // number (numeric value between 0.0 and 10.0) in 'Repetition Penalty' Slider component
  top_p: number; // number (numeric value between 0.0 and 1.0) in 'Top P' Slider component
  max_mel_tokens: number; // number (numeric value between 10 and 600) in 'Max Mel Tokens' Slider component
  cond_free: boolean; // boolean  in 'Cond Free' Checkbox component
  cond_free_k: number; // number (numeric value between 0 and 10) in 'Cond Free K' Slider component
  diffusion_temperature: number; // number (numeric value between 0.0 and 1.0) in 'Temperature' Slider component
  generation_name: string; // string  in 'Generation Name' Textbox component

  model: string; // string (Option from: ['Default']) in 'parameter_2488' Dropdown component
  kv_cache: boolean; // boolean  in 'parameter_2493' Checkbox component
  use_deepspeed: boolean; // boolean  in 'parameter_2494' Checkbox component
  half: boolean; // boolean  in 'parameter_2495' Checkbox component
  use_basic_cleaners: boolean; // boolean  in 'parameter_2497' Checkbox component
  tokenizer: string; // string
};

export const initialState: TortoiseGenerationParams = {
  //   autoregressive
  samples: 4,
  temperature: 0.8,
  length_penalty: 1.0,
  repetition_penalty: 2.0,
  top_p: 0.8,
  max_mel_tokens: 500,

  //  diffusion
  diffusion_iterations: 30,
  cond_free: false,
  cond_free_k: 2,
  diffusion_temperature: 1.0,

  model: "Default", // string (Option from: ['Default']) in 'parameter_2488' Dropdown component

  prompt: "Howdy!", // string  in 'Prompt' Textbox component
  speaker: "random", // string (Option from: ['random', 'angie', 'applejack', 'cond_latent_example', 'daniel', 'deniro', 'emma', 'freeman', 'geralt', 'halle', 'jlaw', 'lj', 'mol', 'myself', 'pat', 'pat2', 'rainbow', 'snakes', 'tim_reynolds', 'tom', 'train_atkins', 'train_daws', 'train_dotrice', 'train_dreams', 'train_empire', 'train_grace', 'train_kennard', 'train_lescault', 'train_mouse', 'weaver', 'william', 'freeman_2a', 'freeman_3', 'pat4']) in 'parameter_2502' Dropdown component
  preset: "ultra_fast", // string (Option from: ['ultra_fast', 'fast', 'standard', 'high_quality']) in 'parameter_2507' Dropdown component
  seed: -1, // number  in 'parameter_2521' Number component
  cvvp_amount: 0, // number (numeric value between 0.0 and 1.0) in 'CVVP Amount' Slider component
  split_prompt: true, // boolean  in 'Split prompt by lines' Checkbox component
  generation_name: "", // string  in 'Generation Name' Textbox component

  kv_cache: false, // boolean  in 'parameter_2493' Checkbox component
  use_deepspeed: false, // boolean  in 'parameter_2494' Checkbox component
  half: false, // boolean  in 'parameter_2495' Checkbox component
  use_basic_cleaners: false, // boolean  in 'parameter_2497' Checkbox component
  tokenizer: "", // string
};

export const tortoiseGenerationId = "tortoise_generation-tab";

export const sendToBarkVoiceGeneration = (audio?: string) => {
  if (!audio) return;
  updateLocalStorageWithFunction(
    tortoiseGenerationId,
    (vocosParams: TortoiseGenerationParams = initialState) =>
      ({ ...vocosParams, audio } as TortoiseGenerationParams)
  );
  router.push("/bark");
};
