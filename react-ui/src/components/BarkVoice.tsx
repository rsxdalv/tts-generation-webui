import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";
import { BARK_VOICE_TO_TRAIT } from "../data/BARK_VOICE_TO_TRAIT";
import { BARK_LANGUAGE_TO_CODE } from "../data/BARK_LANGUAGE_TO_CODE";

export const BarkVoice = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <div className="flex flex-col gap-2 border border-gray-300 p-2 rounded">
    <h2 className="text-md">Voice:</h2>
    <Language
      barkGenerationParams={barkGenerationParams}
      handleChange={handleChange}
    />
    <SpeakerID
      barkGenerationParams={barkGenerationParams}
      handleChange={handleChange}
    />
    <UseV2
      barkGenerationParams={barkGenerationParams}
      handleChange={handleChange}
    />
    {/* Display selected voice info */}
    <div className="flex flex-col space-y-2">
      <div className="border border-gray-300 p-2 rounded">
        {generate_choice_string(
          barkGenerationParams.useV2,
          barkGenerationParams.languageRadio,
          barkGenerationParams.speakerIdRadio
        )}
      </div>
    </div>
  </div>
);

const create_voice_string = (
  language: string,
  speaker_id: string,
  use_v2: boolean
) => {
  let history_prompt = `${BARK_LANGUAGE_TO_CODE[language]}_speaker_${speaker_id}`;
  if (use_v2) {
    history_prompt = `v2/${history_prompt}`;
  }
  return history_prompt;
};

const generate_choice_string = (
  use_v2: boolean,
  language: string,
  speaker_id: string
) => {
  const history_prompt = create_voice_string(language, speaker_id, use_v2);
  return `Chosen voice: ${history_prompt}, gender: ${BARK_VOICE_TO_TRAIT[history_prompt]}`;
};

const UseV2 = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="flex items-center space-x-2">
    <label className="text-sm">Use V2:</label>
    <input
      type="checkbox"
      name="useV2"
      id="useV2"
      checked={barkGenerationParams.useV2}
      onChange={handleChange}
      className="border border-gray-300 p-2 rounded"
    />
  </div>
);

const SPEAKER_IDS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const SpeakerID = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <>
    <label className="text-sm">Speaker ID:</label>
    <div className="flex flex-row space-x-2">
      {SPEAKER_IDS.map((model) => (
        <div key={model} className="flex items-center">
          <input
            type="radio"
            name="speakerIdRadio"
            id={model}
            value={model}
            checked={barkGenerationParams.speakerIdRadio === model}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <label className="ml-1" htmlFor={model}>
            {model}
          </label>
        </div>
      ))}
    </div>
  </>
);

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

const Language = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <>
    <label className="text-sm">Language:</label>
    <div className="flex flex-row gap-x-2 flex-wrap">
      {BARK_VOICE_LANGUAGES.map((model) => (
        <div key={model} className="flex items-center">
          <input
            type="radio"
            name="languageRadio"
            id={model}
            value={model}
            checked={barkGenerationParams.languageRadio === model}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <label className="ml-1" htmlFor={model}>
            {model}
          </label>
        </div>
      ))}
    </div>
  </>
);
