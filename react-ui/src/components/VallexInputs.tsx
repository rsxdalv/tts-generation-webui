import React from "react";
import {
  VallexParams,
  VallexResult,
  initialVallexParams,
} from "../tabs/VallexParams";
import { HandleChange } from "../types/HandleChange";
import { PromptTextArea } from "./PromptTextArea";
import { ResetButton } from "./ResetButton";
import { commonBorder } from "./commonBorder";

const VALLEX_LANGUAGE_DATA: [string, string][] = [
  ["Mix", "Mix"],
  ["English", "English"],
  ["Chinese 中文", "中文"],
  ["Japanese 日本語", "日本語"],
];

const VALLEX_ACCENT_DATA: [string, string][] = [
  ["No Accent", "no-accent"],
  ["English", "English"],
  ["Chinese 中文", "中文"],
  ["Japanese 日本語", "日本語"],
];

const VALLEX_MODE_DATA: [string, string][] = [
  ["Short", "short"],
  ["Fixed Prompt", "fixed-prompt"],
  ["Sliding Window", "sliding-window"],
];

const VallexRadio = ({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}) => (
  <div className="flex whitespace-nowrap items-center">
    <input
      type="radio"
      name={name}
      id={label}
      value={value}
      checked={checked}
      onChange={onChange}
      className={commonBorder}
    />
    <label className="ml-1 select-none" htmlFor={label}>
      {label}
    </label>
  </div>
);

const VallexChoices = ({
  name,
  choices,
  checked,
  onChange,
  label,
}: {
  name: string;
  choices: [string, string][];
  checked: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-md">{label}:</label>
    <div className="flex gap-x-4">
      {choices.map(([visual_model_language, value]) => (
        <VallexRadio
          key={visual_model_language}
          name={name}
          value={value}
          checked={checked === value}
          onChange={onChange}
          label={visual_model_language}
        />
      ))}
    </div>
  </div>
);

const TokenizeButton = ({ params }: { params: VallexParams }) => {
  const [result, setResult] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  const tokenize = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/vall_e_x_tokenize", {
      method: "POST",
      body: JSON.stringify({
        text: params.text,
        language: params.language,
      }),
    });
    const result = await response.json();
    setResult(result.tokens);
    setLoading(false);
  };

  return (
    <div className="flex flex-col space-y-2">
      <button className="border border-gray-300 p-2 rounded" onClick={tokenize}>
        Preview Tokens
      </button>
      <div className="flex flex-col space-y-2">
        <label className="text-sm">Result:</label>
        {loading && <p>Loading...</p>}
        <textarea
          className="border border-gray-300 p-2 rounded"
          value={result}
          readOnly
          rows={3}
        />
      </div>
    </div>
  );
};

const SplitTextIntoSentences = ({ params }: { params: VallexParams }) => {
  const [result, setResult] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const splitText = async () => {
    setLoading(true);
    const response = await fetch(
      "/api/gradio/vall_e_x_split_text_into_sentences",
      {
        method: "POST",
        body: JSON.stringify({
          text: params.text,
        }),
      }
    );
    const result = await response.json();
    setResult(result.split_text);
    setLoading(false);
  };
  return (
    <div className="flex flex-col space-y-2">
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={splitText}
      >
        Preview sentences
      </button>
      <div className="flex flex-col space-y-2">
        <label className="text-sm">Result:</label>
        {loading && <p>Loading...</p>}
        <textarea
          className="border border-gray-300 p-2 rounded"
          value={result}
          readOnly
          rows={3}
        />
      </div>
    </div>
  );
};

export const VallexInputs = ({
  vallexParams,
  handleChange,
  setVallexParams,
}: {
  vallexParams: VallexParams;
  handleChange: HandleChange;
  setVallexParams: React.Dispatch<React.SetStateAction<VallexParams>>;
  data: VallexResult | null;
}) => (
  <div className="flex gap-x-6 w-full justify-center">
    <div className="flex flex-col gap-y-2 w-1/2">
      <PromptTextArea
        params={vallexParams}
        handleChange={handleChange}
        label="Text"
        name="text"
      />

      {/* Tokenize */}
      <TokenizeButton params={vallexParams} />

      {/* Split text into sentences */}
      <SplitTextIntoSentences params={vallexParams} />

      {/* <PromptTextArea
        params={vallexParams}
        handleChange={handleChange}
        label="Prompt"
        name="prompt"
      /> */}
    </div>

    <div className="flex flex-col gap-y-2 w-1/2">
      <VallexChoices
        label="Language"
        name="language"
        choices={VALLEX_LANGUAGE_DATA}
        checked={vallexParams.language}
        onChange={handleChange}
      />

      <VallexChoices
        label="Accent"
        name="accent"
        choices={VALLEX_ACCENT_DATA}
        checked={vallexParams.accent}
        onChange={handleChange}
      />

      <details className="text-sm">
        <summary>
          For longer audio generation, two extension modes are available (click
          to expand):
        </summary>
        <p>
          <em>(Default) short:</em> This will only generate as long as the
          model's context length.
          <br />
          <em>fixed-prompt:</em> This mode will keep using the same prompt the
          user has provided, and generate audio sentence by sentence.
          <br />
          <em>sliding-window:</em> This mode will use the last sentence as the
          prompt for the next sentence, but has some concern on speaker
          maintenance.
        </p>
      </details>
      <VallexChoices
        label="Long Audio Generation Mode"
        name="mode"
        choices={VALLEX_MODE_DATA}
        checked={vallexParams.mode}
        onChange={handleChange}
      />

      <ResetButton
        params={vallexParams}
        setParams={setVallexParams}
        initialParams={initialVallexParams}
      />
    </div>
  </div>
);
