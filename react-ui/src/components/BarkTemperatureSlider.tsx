import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";

const BarkTemperatureSlider = ({
  barkGenerationParams,
  handleChange,
  label,
  name,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  name: string;
}) => (
  <div className="flex flex-col border border-gray-300 p-2 rounded">
    <label className="text-sm">
      {label}: {barkGenerationParams[name]}
    </label>
    <input
      type="range"
      name={name}
      value={barkGenerationParams[name]}
      onChange={handleChange}
      className="border border-gray-300 py-2 rounded"
      min="0"
      max="1.2"
      step="0.01"
    />
  </div>
);

export const TextTemperature = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <BarkTemperatureSlider
    barkGenerationParams={barkGenerationParams}
    handleChange={handleChange}
    label="Text temperature"
    name="text_temp"
  />
);

export const WaveformTemperature = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <BarkTemperatureSlider
    barkGenerationParams={barkGenerationParams}
    handleChange={handleChange}
    label="Waveform temperature"
    name="waveform_temp"
  />
);
