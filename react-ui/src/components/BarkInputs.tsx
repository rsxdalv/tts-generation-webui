import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";
import { BarkVoice } from "./BarkVoice";
import { BurnInPrompt, BarkPrompt } from "./BarkPrompt";
import { TextTemperature, WaveformTemperature } from "./BarkTemperatureSlider";
import { NPZVoiceDropdown } from "./BarkOldGeneration";
import { PromptType, ForEachSubsequentGeneration } from "./BarkRadios";
import { SeedInput } from "./SeedInput";
import { HandleChange } from "../types/HandleChange";
import { GenericSlider } from "./GenericSlider";

export const BarkInputs = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: HandleChange;
}) => (
  <div className="flex flex-col gap-y-2">
    <div className="flex flex-row gap-x-2">
      <div className="gap-y-2 flex flex-col w-1/2">
        <NPZVoiceDropdown
          barkGenerationParams={barkGenerationParams}
          handleChange={handleChange}
          name="history_prompt_semantic"
          label="History Prompt Semantic"
        />
        <NPZVoiceDropdown
          barkGenerationParams={barkGenerationParams}
          handleChange={handleChange}
          name="history_prompt"
          label="History Prompt"
        />
        <BarkVoice
          barkGenerationParams={barkGenerationParams}
          handleChange={handleChange}
        />
      </div>
      <div className="gap-y-2 w-1/2">
        <PromptType
          barkGenerationParams={barkGenerationParams}
          handleChange={handleChange}
        />
        <ForEachSubsequentGeneration
          barkGenerationParams={barkGenerationParams}
          handleChange={handleChange}
        />
        <div className="flex gap-2">
          <TextTemperature
            barkGenerationParams={barkGenerationParams}
            handleChange={handleChange}
          />
          <WaveformTemperature
            barkGenerationParams={barkGenerationParams}
            handleChange={handleChange}
          />
          <GenericSlider
            label="Max generation duration (s)"
            name="max_length"
            min="0.1"
            max="18"
            step="0.1"
            params={barkGenerationParams}
            handleChange={handleChange}
          />
        </div>
        <SeedInput params={barkGenerationParams} handleChange={handleChange} />
      </div>
    </div>
    <BurnInPrompt
      barkGenerationParams={barkGenerationParams}
      handleChange={handleChange}
    />
    <BarkPrompt
      barkGenerationParams={barkGenerationParams}
      handleChange={handleChange}
    />
  </div>
);
