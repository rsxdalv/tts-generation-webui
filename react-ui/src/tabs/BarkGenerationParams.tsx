import useLocalStorage, {
  updateLocalStorageWithFunction,
} from "../hooks/useLocalStorage";
import router from "next/router";
import { BarkResult } from "./BarkResult";

const inputs = {
  burn_in_prompt: "Howdy!",
  prompt: "Howdy!",
  history_setting: "Empty history",
  languageRadio: "English",
  speakerIdRadio: "0",
  useV2: true,
  text_temp: 0.7,
  waveform_temp: 0.7,
  long_prompt_radio: "Short prompt (<15s)",
  long_prompt_history_radio: "or Use old generation as history:",
  old_generation_dropdown:
    "voices\\2023-06-18_21-51-07__bark__continued_generation.npz",
  seed_input: "123",
  history_prompt_semantic_dropdown:
    "voices\\2023-06-18_21-51-07__bark__continued_generation.npz",
};

export type BarkGenerationParams = {
  burn_in_prompt: string; // string  in 'Burn In Prompt (Optional)' Textbox component
  prompt: string; // string  in 'Prompt' Textbox component
  history_setting: string; // string  in 'History Prompt (voice) setting:' Radio component
  languageRadio: string; // string  in 'parameter_17' Radio component
  speakerIdRadio: string; // string  in 'Speaker ID' Radio component
  useV2: boolean; // boolean  in 'Use V2' Checkbox component
  text_temp: number; // number (numeric value between 0.0 and 1.2) in 'Text temperature' Slider component
  waveform_temp: number; // number (numeric value between 0.0 and 1.2) in 'Waveform temperature' Slider component
  long_prompt_radio: string; // string  in 'Prompt type' Radio component
  long_prompt_history_radio: string; // string  in 'For each subsequent generation:' Radio component
  old_generation_dropdown: string; // string
  seed_input: string; // string  in 'parameter_40' Textbox component
  history_prompt_semantic_dropdown: string; // string
};

export const initialState: BarkGenerationParams = {
  ...inputs,
};

export const barkGenerationId = "bark_generation-tab";

export const sendToBarkAsVoice = (old_generation_dropdown?: string) => {
  if (!old_generation_dropdown) return;
  updateLocalStorageWithFunction(
    barkGenerationId,
    (
      barkParams: BarkGenerationParams = initialState
    ): BarkGenerationParams => ({
      ...barkParams,
      old_generation_dropdown,
      history_prompt_semantic_dropdown: old_generation_dropdown,
      history_setting: "or Use old generation as history:",
    })
  );
  router.push("/bark");
};

export const useBarkGenerationParams = () =>
  useLocalStorage<BarkGenerationParams>(barkGenerationId, initialState);

export const useBarkResult = () =>
  useLocalStorage<BarkResult | null>(barkGenerationId + ".output", null);
