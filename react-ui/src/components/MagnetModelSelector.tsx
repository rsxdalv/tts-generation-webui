import React from "react";
import { MagnetParams } from "../tabs/MagnetParams";
import { HandleChange } from "../types/HandleChange";

const modelMap = {
  Small: { size: "small", 10: true, 30: true },
  Medium: { size: "medium", 10: true, 30: true },
  Audio: { size: "audio", 10: true, 30: false },
};

const canUseDuration = (type: string, isAudio: boolean, duration: string) => {
  const subType = isAudio ? "Audio" : type;
  const { [duration]: canUse } = modelMap[subType];
  return canUse;
};

const modelToType = {
  "facebook/magnet-small-10secs": "Small",
  "facebook/magnet-medium-10secs": "Medium",
  "facebook/magnet-small-30secs": "Small",
  "facebook/magnet-medium-30secs": "Medium",
  "facebook/audio-magnet-small": "Small",
  "facebook/audio-magnet-medium": "Medium",
};

const computeModel = (type: string, isAudio: boolean, duration: number) => {
  const lowerType = type.toLowerCase();
  const durationSuffix = duration === 30 ? "-30secs" : "-10secs";

  return isAudio
    ? `facebook/audio-magnet-${lowerType}`
    : `facebook/magnet-${lowerType}${durationSuffix}`;
};

const getType = (model: string) => {
  return modelToType[model] || "Small";
};

const decomputeModel = (
  model: string
): { type: string; isAudio: boolean; duration: number } => {
  const type = getType(model);
  const duration = model.includes("-30secs") ? 30 : 10;
  const isAudio = model.includes("audio");
  return { type, isAudio, duration };
};

export const MagnetModelSelector = ({
  magnetParams,
  handleChange,
}: {
  magnetParams: MagnetParams;
  handleChange: HandleChange;
}) => {
  const {
    type: modelType,
    isAudio,
    duration,
  } = decomputeModel(magnetParams.model_name);

  const handleSize = (event: React.ChangeEvent<HTMLInputElement>): void =>
    handleChange({
      target: {
        name: "model_name",
        value: computeModel(event.target.value, isAudio, duration),
      },
    });

  const handleAudio = (event: React.ChangeEvent<HTMLInputElement>): void =>
    handleChange({
      target: {
        name: "model_name",
        value: computeModel(
          modelType,
          event.target.value === "Audio",
          duration
        ),
      },
    });

  const handleDuration = (event: React.ChangeEvent<HTMLInputElement>): void =>
    handleChange({
      target: {
        name: "model_name",
        value: computeModel(modelType, isAudio, Number(event.target.value)),
      },
    });

  return (
    <div className="flex flex-col border border-gray-300 p-2 rounded text-md gap-2">
      <div className="text-md">Model:</div>
      <Model params={magnetParams} handleChange={handleChange} />
      <div className="flex gap-2">
        <label className="text-md">Size:</label>
        <div className="flex gap-x-2">
          {["Small", "Medium"].map((type) => (
            <div key={type} className="flex items-center">
              <input
                type="radio"
                name="size"
                id={type}
                value={type}
                checked={modelType === type}
                onChange={handleSize}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="ml-1 select-none" htmlFor={type}>
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <label className="text-md">Audio:</label>
        <div className="flex gap-x-2">
          {["Music", "Audio"].map((type) => (
            <div key={type} className="flex items-center">
              <input
                type="radio"
                name="audio"
                id={type}
                value={type}
                checked={isAudio === (type === "Audio")}
                onChange={handleAudio}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="ml-1 select-none" htmlFor={type}>
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <label className="text-md">Duration:</label>
        <div className="flex gap-x-2">
          {["10", "30"].map((d) => (
            <div key={d} className="flex items-center">
              <input
                type="radio"
                name="duration"
                id={d}
                value={d}
                checked={d === String(duration)}
                onChange={handleDuration}
                className="border border-gray-300 p-2 rounded"
                disabled={!canUseDuration(modelType, isAudio, d)}
              />
              <label className="ml-1 select-none" htmlFor={d}>
                {d}s
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Model = ({
  params,
  handleChange,
}: {
  params: MagnetParams;
  handleChange: HandleChange;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchOptions = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/magnet_get_models", {
      method: "POST",
    });

    const result = await response.json();
    setOptions(result);
    setLoading(false);
  };

  const openModels = async () => {
    await fetch("/api/gradio/magnet_open_model_dir", {
      method: "POST",
    });
  };

  React.useEffect(() => {
    fetchOptions();
  }, []);

  const selected = params?.model_name;
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex gap-2">
        <select
          name="model_name"
          id="model_name"
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
          onClick={openModels}
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
    </div>
  );
};
