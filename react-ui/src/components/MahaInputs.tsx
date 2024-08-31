import React from "react";
import { MahaParams, MahaResult, initialMahaParams } from "../tabs/MahaParams";
import { HandleChange } from "../types/HandleChange";
import { PromptTextArea } from "./PromptTextArea";
import { SeedInput } from "./SeedInput";

const commonBorder = "border border-gray-300 p-2 rounded";

const deviceList = ["auto", "cpu", "cuda"];

const Speaker = ({
  mahaParams,
  handleChange,
}: {
  mahaParams: MahaParams;
  handleChange: HandleChange;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchOptions = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/maha_tts_refresh_voices", {
      method: "POST",
    });

    const result = await response.json();
    setOptions(result);
    setLoading(false);
  };

  const openVoices = async () => {
    await fetch("/api/gradio/tortoise_open_voices", {
      method: "POST",
    });
  };

  React.useEffect(() => {
    fetchOptions();
  }, []);

  const selected = mahaParams?.speaker_name;
  return (
    <div className="flex gap-2">
      <label className="text-sm">Speaker:</label>
      <select
        name="speaker_name"
        id="speaker_name"
        className="border border-gray-300 p-2 rounded text-black w-full"
        value={selected}
        onChange={handleChange}
      >
        {options
          // concat to ensure selected is at the top and present
          .filter((option) => option !== selected)
          .concat(selected)
          .map((bandwidth) => (
            <option key={bandwidth} value={bandwidth}>
              {bandwidth}
            </option>
          ))}
      </select>
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={openVoices}
      >
        Open
      </button>
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={fetchOptions}
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
};

export const MahaInputs = ({
  mahaParams,
  handleChange,
  resetParams,
}: {
  mahaParams: MahaParams;
  handleChange: HandleChange;
  resetParams: () => void;
}) => (
  <div className="flex gap-x-6 w-full justify-center">
    <div className="flex flex-col gap-y-2 w-1/2">
      <PromptTextArea
        params={mahaParams}
        handleChange={handleChange}
        label="Text"
        name="text"
      />
    </div>
    <div className="flex flex-col gap-y-2 w-1/2">
      <div className="flex gap-2 items-center">
        <label className="text-sm">Model Language:</label>
        <div className="flex gap-x-4">
          {[
            ["English", "Smolie-en"],
            ["Indian", "Smolie-in"],
          ].map(([text, model_name]) => (
            <div key={text} className="flex items-center">
              <input
                type="radio"
                name="model_name"
                id={text}
                value={model_name}
                checked={mahaParams.model_name === model_name}
                onChange={(event) => {
                  console.log(event.target.value);
                  if (event.target.value === "Smolie-en") {
                    handleChange({
                      target: {
                        name: "text_language",
                        value: "english",
                      },
                    });
                  }
                  handleChange(event);
                }}
                className={commonBorder}
              />
              <label className="ml-1 select-none" htmlFor={text}>
                {text}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        <label className="text-sm">TTS Language:</label>
        <div className="flex flex-wrap gap-x-4">
          {[
            "english",
            "tamil",
            "telugu",
            "punjabi",
            "marathi",
            "hindi",
            "gujarati",
            "bengali",
            "assamese",
          ].map((text_language) => (
            <div key={text_language} className="flex items-center">
              <input
                type="radio"
                name="text_language"
                id={text_language}
                value={text_language}
                checked={mahaParams.text_language === text_language}
                onChange={handleChange}
                disabled={mahaParams.model_name !== "Smolie-in"}
                className={commonBorder}
              />
              <label className="ml-1 select-none" htmlFor={text_language}>
                {text_language.charAt(0).toUpperCase() +
                  text_language.slice(1)}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Speaker mahaParams={mahaParams} handleChange={handleChange} />

      <SeedInput params={mahaParams} handleChange={handleChange} />

      <div className="flex gap-2 items-center">
        <label className="text-sm">Device:</label>
        <div className="flex gap-x-4">
          {deviceList.map((device) => (
            <div key={device} className="flex items-center">
              <input
                type="radio"
                name="device"
                id={device}
                value={device}
                checked={mahaParams.device === device}
                onChange={handleChange}
                className={commonBorder}
              />
              <label className="ml-1 select-none" htmlFor={device}>
                {device}
              </label>
            </div>
          ))}
        </div>
      </div>

      <button className={commonBorder} onClick={resetParams}>
        Reset Parameters
      </button>
    </div>
  </div>
);
