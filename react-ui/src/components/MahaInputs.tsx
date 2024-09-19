import React from "react";
import { MahaParams, MahaResult, initialMahaParams } from "../tabs/MahaParams";
import { HandleChange } from "../types/HandleChange";
import { PromptTextArea } from "./PromptTextArea";
import { SeedInput } from "./SeedInput";
import { ModelDropdown } from "./component/ModelDropdown";
import { Button } from "./ui/button";
import { RadioWithLabel } from "./component/RadioWithLabel";

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
    <ModelDropdown
      name="speaker_name"
      label="Speaker"
      options={options
        .filter((option) => option !== selected)
        .concat(selected)
        .filter((x) => x !== "")}
      value={selected}
      onChange={handleChange}
      onRefresh={fetchOptions}
      onOpen={openVoices}
      loading={loading}
    />
    // <div className="flex gap-2">
    //   <label className="text-sm">Speaker:</label>
    //   <select
    //     name="speaker_name"
    //     id="speaker_name"
    //     className="cell text-black w-full"
    //     value={selected}
    //     onChange={handleChange}
    //   >
    //     {options
    //       // concat to ensure selected is at the top and present
    //       .filter((option) => option !== selected)
    //       .concat(selected)
    //       .map((bandwidth) => (
    //         <option key={bandwidth} value={bandwidth}>
    //           {bandwidth}
    //         </option>
    //       ))}
    //   </select>
    //   <button
    //     className="cell"
    //     onClick={openVoices}
    //   >
    //     Open
    //   </button>
    //   <button
    //     className="cell"
    //     onClick={fetchOptions}
    //   >
    //     {loading ? "Refreshing..." : "Refresh"}
    //   </button>
    // </div>
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
    <div className="flex flex-col gap-y-4 w-1/2">
      <PromptTextArea
        params={mahaParams}
        handleChange={handleChange}
        label="Text"
        name="text"
      />
      <RadioWithLabel
        label="Model"
        name="model_name"
        inline
        value={mahaParams.model_name}
        onChange={handleChange}
        options={[
          ["English", "Smolie-en"],
          ["Indian", "Smolie-in"],
        ].map(([text, model_name]) => ({
          label: text,
          value: model_name,
        }))}
      />

      <RadioWithLabel
        label="Text Language"
        name="text_language"
        inline
        className="flex-col items-start"
        value={mahaParams.text_language}
        onChange={handleChange}
        options={[
          "english",
          "tamil",
          "telugu",
          "punjabi",
          "marathi",
          "hindi",
          "gujarati",
          "bengali",
          "assamese",
        ].map((text_language) => ({
          label: text_language[0].toUpperCase() + text_language.slice(1),
          value: text_language,
        }))}
      />
    </div>
    <div className="flex flex-col gap-y-4 w-1/2">

      <Speaker mahaParams={mahaParams} handleChange={handleChange} />

      <SeedInput params={mahaParams} handleChange={handleChange} />

      <RadioWithLabel
        label="Device"
        name="device"
        inline
        value={mahaParams.device}
        onChange={handleChange}
        options={["auto", "cpu", "cuda"].map((device) => ({
          label: device,
          value: device,
        }))}
      />

      <Button variant="outline" onClick={resetParams}>
        Reset Parameters
      </Button>
    </div>
  </div>
);
