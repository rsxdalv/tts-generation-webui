import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";
import { GenericSlider } from "./GenericSlider";

const TemperatureSlider = <
  T extends {
    [key: string]: number | string | boolean;
  }
>({
  params,
  handleChange,
  label,
  name,
}: {
  params: T;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  name: keyof T;
}) => (
  <GenericSlider
    params={params}
    handleChange={handleChange}
    label={label}
    name={name}
    min="0.0"
    max="1.2"
    step="0.01"
  />
);

export const TextTemperature = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <TemperatureSlider
    params={barkGenerationParams}
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
  <TemperatureSlider
    params={barkGenerationParams}
    handleChange={handleChange}
    label="Waveform temperature"
    name="waveform_temp"
  />
);
