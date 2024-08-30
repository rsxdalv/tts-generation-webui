import React from "react";
import { HandleChange } from "../types/HandleChange";

export const SeedInput = <
  T extends {
    use_random_seed?: boolean;
    seed: number | string | undefined;
  }
>({
  params,
  handleChange,
  className,
}: {
  params: T;
  handleChange: HandleChange;
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
    <label className="text-base">Randomize seed:</label>
    <input
      type="checkbox"
      name="use_random_seed"
      checked={params.use_random_seed}
      onChange={handleChange}
      className="border border-gray-300 p-2 rounded text-base"
    />
  </div>
);
