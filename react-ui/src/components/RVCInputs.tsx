import React from "react";
import { AudioInput } from "./AudioComponents";
import { RVCParams } from "../tabs/RVCParams";

export const RVCInputs = ({
  rvcParams,
  handleChange,
  hideAudioInput,
}: {
  rvcParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
  hideAudioInput?: boolean;
}) => {
  return (
    <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded">
      <label className="text-sm">RVC Parameters:</label>
      <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded">
        <label className="text-sm">Core:</label>
        <Model rvcParams={rvcParams} handleChange={handleChange} />
        <Index rvcParams={rvcParams} handleChange={handleChange} />
        <div className="flex gap-2">
          <label className="text-sm">Device:</label>
          <select
            name="device"
            id="device"
            className="border border-gray-300 p-2 rounded text-black w-full"
            value={rvcParams?.device}
            onChange={handleChange}
          >
            {["cuda:0", "cpu", "mps"].map((device) => (
              <option key={device} value={device}>
                {device}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <label className="text-sm">Use half precision model:</label>
          <input
            type="checkbox"
            name="use_half_precision_model"
            checked={rvcParams?.use_half_precision_model}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
        </div>
      </div>
      {!hideAudioInput && (
        <AudioInput
          callback={(original_audio?: string) => {
            handleChange({
              target: {
                name: "original_audio",
                value: original_audio,
              },
            } as React.ChangeEvent<HTMLInputElement>);
          }}
          label="Original Audio"
          filter={["sendToRvc"]}
          url={rvcParams?.original_audio}
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-y-2">
          <div className="flex gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-x-2">
                <GenericSlider
                  rvcParams={rvcParams}
                  handleChange={handleChange}
                  label="Pitch Up key"
                  name="pitch_up_key"
                  min="-24"
                  max="24"
                  step="1"
                  className="w-full"
                />
                <input
                  type="number"
                  name="pitch_up_key"
                  value={rvcParams.pitch_up_key}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-1/4"
                />
              </div>
              {/* search feature ratio */}
              <GenericSlider
                rvcParams={rvcParams}
                handleChange={handleChange}
                label="Search Feature Ratio"
                name="search_feature_ratio"
                min="0.0"
                max="1.0"
                step="0.01"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm">Pitch Collection Method:</label>
              {["harvest", "pm", "crepe", "rmvpe", "fcpe"].map(
                (pitch_collection_method) => (
                  <div
                    key={pitch_collection_method}
                    className="flex items-center"
                  >
                    <input
                      type="radio"
                      name="pitch_collection_method"
                      id={pitch_collection_method}
                      value={pitch_collection_method}
                      checked={
                        rvcParams.pitch_collection_method ===
                        pitch_collection_method
                      }
                      onChange={handleChange}
                      className="border border-gray-300 p-2 rounded"
                    />
                    <label className="ml-1" htmlFor={pitch_collection_method}>
                      {pitch_collection_method}
                    </label>
                  </div>
                )
              )}
            </div>
          </div>
          <div className="flex flex-col gap-y-2">
            <GenericSlider
              rvcParams={rvcParams}
              handleChange={handleChange}
              label="Filter Radius (Pitch)"
              name="filter_radius_pitch"
              min="0"
              max="10"
              step="1"
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-2">
          <div className="flex flex-col gap-y-2">
            <GenericSlider
              rvcParams={rvcParams}
              handleChange={handleChange}
              label="Resample Sample-rate"
              name="resample_sample_rate"
              min="0"
              max="48000"
              step="1"
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <GenericSlider
              rvcParams={rvcParams}
              handleChange={handleChange}
              label="Voice Envelope Normalizaiton"
              name="voice_envelope_normalizaiton"
              min="0.0"
              max="1.0"
              step="0.01"
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <GenericSlider
              rvcParams={rvcParams}
              handleChange={handleChange}
              label="Protect Breath Sounds"
              name="protect_breath_sounds"
              min="0.0"
              max="0.5"
              step="0.01"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
const Model = ({
  rvcParams: rvcGenerationParams,
  handleChange,
}: {
  rvcParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchOptions = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/rvc_model_reload", {
      method: "POST",
    });

    const result = await response.json();
    setOptions(result);
    setLoading(false);
  };

  const openModels = async () => {
    await fetch("/api/gradio/rvc_model_open", {
      method: "POST",
    });
  };

  React.useEffect(() => {
    fetchOptions();
  }, []);

  const selected = rvcGenerationParams?.model;
  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex gap-2">
        <label className="text-sm">Model:</label>
        <select
          name="model"
          id="model"
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
// Like model but for Index
const Index = ({
  rvcParams: rvcGenerationParams,
  handleChange,
}: {
  rvcParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchOptions = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/rvc_index_reload", {
      method: "POST",
    });

    const result = await response.json();
    setOptions(result);
    setLoading(false);
  };

  const openModels = async () => {
    await fetch("/api/gradio/rvc_index_open", {
      method: "POST",
    });
  };

  React.useEffect(() => {
    fetchOptions();
  }, []);

  const selected = rvcGenerationParams?.index;
  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex gap-2">
        <label className="text-sm">Index:</label>
        <select
          name="index"
          id="index"
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
const GenericSlider = ({
  rvcParams: rvcGenerationParams,
  handleChange,
  label,
  name,
  min,
  max,
  step,
  className,
}: {
  rvcParams: RVCParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  name: string;
  min: string;
  max: string;
  step: string;
  className?: string;
}) => {
  return (
    <div
      className={`flex flex-col border border-gray-300 p-2 rounded ${className}`}
    >
      <label className="text-sm">
        {label}: {rvcGenerationParams[name]}
      </label>
      <input
        type="range"
        name={name}
        value={rvcGenerationParams[name]}
        onChange={handleChange}
        className="border border-gray-300 py-2 rounded"
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
};
