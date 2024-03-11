import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";

export const HistoryPromptVoiceSetting = ({
  barkGenerationParams, handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (
    event: React.ChangeEvent<HTMLInputElement> |
      React.ChangeEvent<HTMLTextAreaElement> |
      React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
    <label className="text-sm">History Prompt (voice) setting:</label>
    <div className="flex flex-row space-x-2">
      {[
        "Empty history",
        "or Use a voice:",
        "or Use old generation as history:",
      ].map((model) => (
        <div key={model} className="flex items-center">
          <input
            type="radio"
            name="history_setting"
            id={model}
            value={model}
            checked={barkGenerationParams.history_setting === model}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded" />
          <label className="ml-1" htmlFor={model}>
            {model}
          </label>
        </div>
      ))}
    </div>
  </div>
);
export const ForEachSubsequentGeneration = ({
  barkGenerationParams, handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div>
      <label className="text-sm">For each subsequent generation:</label>
      <div className="flex flex-col space-y-2">
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
              checked={barkGenerationParams.long_prompt_history_radio ===
                subsequentSetting}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded" />
            <label className="ml-1" htmlFor={subsequentSetting}>
              {subsequentSetting}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
export const PromptType = ({
  barkGenerationParams, handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (
    event: React.ChangeEvent<HTMLInputElement> |
      React.ChangeEvent<HTMLTextAreaElement> |
      React.ChangeEvent<HTMLSelectElement>
  ) => void;
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
            className="border border-gray-300 p-2 rounded" />
          <label className="ml-1" htmlFor={promptType}>
            {promptType}
          </label>
        </div>
      ))}
    </div>
  </div>
);
