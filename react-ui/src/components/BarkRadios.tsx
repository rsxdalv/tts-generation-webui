import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";
import { HandleChange } from "../types/HandleChange";

export const ForEachSubsequentGeneration = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: HandleChange;
}) => (
  <div>
    <label className="text-sm">For each subsequent generation:</label>
    <div className="flex gap-2">
      {[
        "Use old generation as history",
        "or Use history prompt setting",
        "or Clear history",
      ].map((subsequentSetting) => (
        <div key={subsequentSetting} className="flex items-center">
          <input
            type="radio"
            name="long_prompt_history_radio"
            id={subsequentSetting}
            value={subsequentSetting}
            checked={
              barkGenerationParams.long_prompt_history_radio ===
              subsequentSetting
            }
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <label className="ml-1" htmlFor={subsequentSetting}>
            {subsequentSetting}
          </label>
        </div>
      ))}
    </div>
  </div>
);

export const PromptType = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: HandleChange;
}) => (
  <div>
    <label className="text-sm">Prompt type:</label>
    <div className="flex flex-row space-x-2">
      {["Short prompt (<15s)", "Split prompt by lines"].map((promptType) => (
        <div key={promptType} className="flex items-center">
          <input
            type="radio"
            name="long_prompt_radio"
            id={promptType}
            value={promptType}
            checked={barkGenerationParams.long_prompt_radio === promptType}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <label className="ml-1" htmlFor={promptType}>
            {promptType}
          </label>
        </div>
      ))}
    </div>
  </div>
);
