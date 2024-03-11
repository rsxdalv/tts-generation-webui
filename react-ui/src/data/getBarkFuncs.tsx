import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";
import { BarkResult } from "../tabs/BarkResult";
import { barkFavorite } from "../functions/barkFavorite";

export function getBarkFuncs(
  setBarkVoiceGenerationParams: React.Dispatch<
    React.SetStateAction<BarkGenerationParams>
  >,
  barkGenerationParams: BarkGenerationParams
) {
  const useAsHistory = (_url: string, data?: BarkResult) => {
    const npz = data?.npz;
    if (!npz) return;
    setBarkVoiceGenerationParams({
      ...barkGenerationParams,
      old_generation_dropdown: npz,
    });
  };

  const useAsHistoryPromptSemantic = (_url: string, data?: BarkResult) => {
    const npz = data?.npz;
    if (!npz) return;
    setBarkVoiceGenerationParams({
      ...barkGenerationParams,
      history_prompt_semantic_dropdown: npz,
    });
  };

  const useSeed = (_url: string, data?: BarkResult) => {
    const seed_input = data?.json_text?.seed;
    if (!seed_input) return;
    setBarkVoiceGenerationParams({
      ...barkGenerationParams,
      seed_input,
    });
  };

  const useParametersTest = (_url: string, data?: BarkResult) => {
    const {
      prompt, language, speaker_id, text_temp, waveform_temp, history_prompt, history_prompt_npz, semantic_prompt, coarse_prompt,
    } = (data?.json_text)!;
    if (!prompt) return;
    setBarkVoiceGenerationParams({
      ...barkGenerationParams,
      prompt,
      languageRadio: language,
      speakerIdRadio: speaker_id,
      text_temp,
      waveform_temp,
      history_setting: history_prompt,
      old_generation_dropdown: history_prompt_npz,
      history_prompt_semantic_dropdown: semantic_prompt,
      burn_in_prompt: coarse_prompt,
      long_prompt_radio: "Short prompt (<15s)",
      seed_input: data?.json_text?.seed ?? "-1",
      useV2: data?.json_text?.history_prompt?.includes("v2") ?? true,
    });
  };

  return {
    useAsHistory,
    useAsHistoryPromptSemantic,
    useSeed,
    favorite: barkFavorite,
    useParametersTest,
  };
}
