import useLocalStorage, {
  readLocalStorage,
  updateLocalStorageWithFunction,
} from "../hooks/useLocalStorage";
import router from "next/router";
import { parseFormChange } from "../data/parseFormChange";
import { generateWithBark } from "../functions/generateWithBark";
import { useHistory } from "../hooks/useHistory";
import { BarkResult } from "./BarkResult";
import { getBarkFuncs } from "../data/getBarkFuncs";
import { Seeded } from "../types/Seeded";

export type BarkGenerationParams = Seeded & {
  burn_in_prompt: string; // string  in 'Burn In Prompt (Optional)' Textbox component
  text: string; // string  in 'Prompt' Textbox component
  history_setting: string; // string  in 'History Prompt (voice) setting:' Radio component
  languageRadio: string; // string  in 'parameter_17' Radio component
  speakerIdRadio: string; // string  in 'Speaker ID' Radio component
  useV2: boolean; // boolean  in 'Use V2' Checkbox component
  text_temp: number; // number (numeric value between 0.0 and 1.2) in 'Text temperature' Slider component
  waveform_temp: number; // number (numeric value between 0.0 and 1.2) in 'Waveform temperature' Slider component
  long_prompt_radio: string; // string  in 'Prompt type' Radio component
  long_prompt_history_radio: string; // string  in 'For each subsequent generation:' Radio component
  old_generation_dropdown: string; // string
  history_prompt_semantic_dropdown: string; // string
  max_gen_duration_s: number; // number  in 'Max generation duration (s)' Number component
};

export const initialState: BarkGenerationParams = {
  seed: 0,
  use_random_seed: true,

  burn_in_prompt: "",
  text: "",
  history_setting: "Empty history",
  languageRadio: "English",
  speakerIdRadio: "0",
  useV2: true,
  text_temp: 0.7,
  waveform_temp: 0.7,
  long_prompt_radio: "Short prompt (<15s)",
  long_prompt_history_radio: "or Use old generation as history:",
  old_generation_dropdown: "",
  history_prompt_semantic_dropdown: "",
  max_gen_duration_s: 15,
};

export const barkGenerationId = "bark_generation-tab.v3";

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

export const getBarkGenerationParams = (): BarkGenerationParams =>
  readLocalStorage(barkGenerationId) ?? initialState;

export const useBarkPage = () => {
  const [barkGenerationParams, setBarkGenerationParams] =
    useBarkGenerationParams();

  const [historyData, setHistoryData] = useHistory<BarkResult>("bark");

  async function consumer(params: BarkGenerationParams) {
    if (params.use_random_seed)
      setBarkGenerationParams((x) => ({ ...x, seed: params.seed }));
    const result = await generateWithBark(params);
    setHistoryData((historyData) => [result, ...historyData]);
  }

  return {
    barkGenerationParams,
    setBarkGenerationParams,
    historyData,
    setHistoryData,
    consumer,
    handleChange: parseFormChange(setBarkGenerationParams),
    funcs: getBarkFuncs(setBarkGenerationParams, barkGenerationParams),
  };
};
