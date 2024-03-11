import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";
import { getWebuiURL } from "../data/getWebuiURL";
import { encodecDecode } from "../functions/encodecDecode";
import { saveToVoices } from "../functions/saveToVoices";

// generic old generation dropdown for both OldGeneration and HistoryPromptSemantic
const NPZVoiceDropdown = ({
  barkGenerationParams, handleChange, name, label,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  name: string;
  label: string;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);

  const refreshOptions = async () => {
    const result = await reloadOldGenerationDropdown();
    setOptions(result);
  };

  React.useEffect(() => void refreshOptions(), []);

  const selected = barkGenerationParams?.[name];

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm">{label}:</label>
      <select
        name={name}
        id={name}
        className="border border-gray-300 p-2 rounded text-black w-full"
        value={selected}
        onChange={handleChange}
      >
        {selected && <option value={selected}>{selected}</option>}
        {options
          .filter((option) => option !== selected)
          .map((npzFile) => (
            <option key={npzFile} value={npzFile}>
              {npzFile}
            </option>
          ))}
      </select>
      <div className="flex flex-row space-x-2">
        <button
          className="border border-gray-300 p-2 rounded"
          onClick={refreshOptions}
        >
          Refresh
        </button>
        <button
          className="border border-gray-300 p-2 rounded"
          onClick={() => handleChange({ target: { name, value: "" } } as any)}
        >
          Clear
        </button>
        <button
          className="border border-gray-300 p-2 rounded"
          onClick={() => window.open(getWebuiURL(selected), "_blank")}
        >
          Download
        </button>
        <button
          className="border border-gray-300 p-2 rounded"
          onClick={async () => {
            const url = getWebuiURL(selected);
            const urlWithHost = `${window.location.origin}/${url}`;
            const x = await encodecDecode({ npz_file: urlWithHost });
            const audio = new Audio(x.data);
            audio.play();
          }}
        >
          Play as Audio
        </button>
        <button
          className="border border-gray-300 p-2 rounded"
          onClick={() => saveToVoices(selected)}
        >
          Save to Voices
        </button>
      </div>
    </div>
  );
};
export const OldGeneration = ({
  barkGenerationParams, handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <NPZVoiceDropdown
    barkGenerationParams={barkGenerationParams}
    handleChange={handleChange}
    name="old_generation_dropdown"
    label="Old generation" />
);
export const HistoryPromptSemantic = ({
  barkGenerationParams, handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <NPZVoiceDropdown
    barkGenerationParams={barkGenerationParams}
    handleChange={handleChange}
    name="history_prompt_semantic_dropdown"
    label="History prompt semantic" />
);

async function reloadOldGenerationDropdown() {
  const response = await fetch("/api/gradio/reload_old_generation_dropdown", {
    method: "POST",
  });

  return await response.json();
}
