import React from "react";
import { HandleChange } from "../types/HandleChange";

export const SeedInput = <T extends { seed: number | string | undefined }>({
  params,
  handleChange,
  setParams,
  seed,
  className,
}: {
  params: T;
  handleChange: HandleChange;
  setParams: React.Dispatch<React.SetStateAction<T>>;
  seed: number | string | undefined;
  className?: string;
}) => (
  <div className={`flex gap-x-2 items-center w-full ${className}`}>
    <label className="text-base">Seed:</label>
    <input
      type="number"
      name="seed"
      value={params.seed}
      onChange={handleChange}
      maxLength={10}
      className="border border-gray-300 p-2 rounded text-base w-36"
    />
    <button
      className="border border-gray-300 p-2 rounded text-base"
      onClick={() => setParams({ ...params, seed: Number(seed) || -1 })}
    >
      Restore&nbsp;Last
    </button>
    <button
      className="border border-gray-300 p-2 rounded text-base"
      onClick={() => setParams({ ...params, seed: -1 })}
    >
      Randomize
    </button>
  </div>
);
