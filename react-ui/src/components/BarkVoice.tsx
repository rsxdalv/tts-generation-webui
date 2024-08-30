import React, { useState } from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";
import { BARK_VOICE_TO_TRAIT } from "../data/BARK_VOICE_TO_TRAIT";
import { BARK_LANGUAGE_TO_CODE } from "../data/BARK_LANGUAGE_TO_CODE";
import { HandleChange } from "../types/HandleChange";

export const BarkVoice = ({
  barkGenerationParams,
  handleChange: handleChange2,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: HandleChange;
}) => {
  const [language, setLanguage] = useState("English");
  const [speakerID, setSpeakerID] = useState("0");
  const [useV2, setUseV2] = useState(true);

  const updatePrompt = (language: string, speakerID: string, useV2: boolean) =>
    handleChange2({
      target: {
        name: "history_prompt",
        value: `${useV2 ? "v2/" : ""}${
          BARK_LANGUAGE_TO_CODE[language]
        }_speaker_${speakerID}`,
      },
    });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    switch (e.target.name) {
      case "language":
        const newLanguage = e.target.value;
        setLanguage(newLanguage);
        updatePrompt(newLanguage, speakerID, useV2);
        break;
      case "speakerID":
        const newSpeakerID = e.target.value;
        setSpeakerID(newSpeakerID);
        updatePrompt(language, newSpeakerID, useV2);
        break;
      case "useV2":
        const newUseV2 = e.target.checked;
        setUseV2(newUseV2);
        updatePrompt(language, speakerID, newUseV2);
        break;
    }
  };

  return (
    <div className="flex flex-col gap-2 border border-gray-300 p-2 rounded">
      <h2 className="text-md">Voice:</h2>
      <label className="text-sm">Language:</label>
      <div className="flex flex-row gap-x-2 flex-wrap">
        {BARK_VOICE_LANGUAGES.map((model) => (
          <div key={model} className="flex items-center">
            <input
              type="radio"
              name="language"
              id={model}
              value={model}
              checked={language === model}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded"
            />
            <label className="ml-1" htmlFor={model}>
              {model}
            </label>
          </div>
        ))}
      </div>
      <label className="text-sm">Speaker ID:</label>
      <div className="flex flex-row space-x-2">
        {SPEAKER_IDS.map((model) => (
          <div key={model} className="flex items-center">
            <input
              type="radio"
              name="speakerID"
              id={model}
              value={model}
              checked={speakerID === model}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded"
            />
            <label className="ml-1" htmlFor={model}>
              {model}
            </label>
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm">Use V2:</label>
        <input
          type="checkbox"
          name="useV2"
          id="useV2"
          checked={useV2}
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded"
        />
      </div>
      <div className="border border-gray-300 p-2 rounded">
        Chosen voice: {barkGenerationParams.history_prompt}
        &nbsp;gender: {BARK_VOICE_TO_TRAIT[barkGenerationParams.history_prompt] || "Unknown"}
      </div>
    </div>
  );
};

const SPEAKER_IDS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const BARK_VOICE_LANGUAGES = [
  "English",
  "German",
  "Spanish",
  "French",
  "Hindi",
  "Italian",
  "Japanese",
  "Korean",
  "Polish",
  "Portuguese",
  "Russian",
  "Turkish",
  "Chinese",
];
