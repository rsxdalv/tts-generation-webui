import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";
import { getWebuiURL, getWebuiURLWithHost } from "../data/getWebuiURL";
import { encodecDecode } from "../functions/encodecDecode";
import { saveToVoices } from "../functions/saveToVoices";

export const NPZVoiceDropdown = ({
  barkGenerationParams,
  handleChange,
  name,
  label,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  name: string;
  label: string;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);

  const refreshOptions = async () => {
    const options = await reloadOldGenerationDropdown();
    console.log(options);
    setOptions(options);
  };

  React.useEffect(() => void refreshOptions(), []);

  const selected = barkGenerationParams?.[name];

  return (
    <div className="flex flex-col gap-y-2">
      <label className="text-sm">{label}:</label>
      <select
        name={name}
        id={name}
        className="cell text-black w-full"
        value={selected}
        onChange={handleChange}
      >
        <option value="">No prompt</option>
        {selected && <option value={selected}>{selected}</option>}
        {options
          .filter((option) => option !== selected)
          .map((npzFile) => (
            <option key={npzFile} value={npzFile}>
              {npzFile}
            </option>
          ))}
      </select>
      <div className="flex flex-row gap-x-2">
        <button
          className="cell"
          onClick={refreshOptions}
        >
          Refresh
        </button>
        <button
          className="cell"
          onClick={() => handleChange({ target: { name, value: null } } as any)}
        >
          Clear
        </button>
        <button
          className="cell"
          onClick={() => window.open(getWebuiURL(selected), "_blank")}
        >
          Download
        </button>
        <button
          className="cell"
          onClick={async () => {
            const urlWithHost = getWebuiURLWithHost(selected);
            const x = await encodecDecode({ npz_file: urlWithHost });
            const audio = new Audio(x.data);
            audio.play();
          }}
        >
          Play as Audio
        </button>
        <button
          className="cell"
          onClick={() => saveToVoices(selected)}
        >
          Save to Voices
        </button>
      </div>
    </div>
  );
};

async function reloadOldGenerationDropdown() {
  const response = await fetch("/api/gradio/reload_old_generation_dropdown", {
    method: "POST",
  });

  return await response.json();
}
