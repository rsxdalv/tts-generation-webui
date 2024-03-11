import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";

export const BarkPrompt = ({
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
  <PromptTextArea
    barkGenerationParams={barkGenerationParams}
    handleChange={handleChange}
    label="Prompt"
    name="prompt"
  />
);

const PromptTextArea = ({
  barkGenerationParams,
  handleChange,
  label,
  name,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label: string;
  name: string;
}) => (
  <div className="flex flex-col space-y-2">
    <label className="text-sm">{label}:</label>
    <textarea
      name={name}
      value={barkGenerationParams[name]}
      onChange={handleChange}
      className="border border-gray-300 p-2 rounded resize-none"
      placeholder="Enter text here..."
      rows={3}
    />
  </div>
);

export const BurnInPrompt = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) => (
  <PromptTextArea
    barkGenerationParams={barkGenerationParams}
    handleChange={handleChange}
    label="Burn In Prompt (Optional)"
    name="burn_in_prompt"
  />
);
