import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";
import { SeedInput } from "./SeedInput";

export const BarkSeed = ({
  barkGenerationParams,
  setBarkVoiceGenerationParams,
  handleChange,
  lastSeed,
}: {
  barkGenerationParams: BarkGenerationParams;
  setBarkVoiceGenerationParams: (
    barkGenerationParams: BarkGenerationParams
  ) => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  lastSeed?: string;
}) => {
  return (
    <SeedInput
      params={barkGenerationParams}
      handleChange={handleChange}
      setParams={setBarkVoiceGenerationParams}
      seed={lastSeed}
    />
  );
};
