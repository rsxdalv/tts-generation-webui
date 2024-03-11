import React from "react";
import { BarkGenerationParams } from "../tabs/BarkGenerationParams";

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
    <div className="flex items-center space-x-2">
      <label className="text-sm">Seed:</label>
      <input
        type="text"
        name="seed_input"
        value={barkGenerationParams.seed_input}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded"
      />
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={() => {
          setBarkVoiceGenerationParams({
            ...barkGenerationParams,
            seed_input: lastSeed ?? "-1",
          });
        }}
      >
        Restore Last
      </button>
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={() => {
          setBarkVoiceGenerationParams({
            ...barkGenerationParams,
            // seed_input: randomSeed().toString(),
            seed_input: "-1",
          });
        }}
      >
        Randomize
      </button>
    </div>
  );
};
