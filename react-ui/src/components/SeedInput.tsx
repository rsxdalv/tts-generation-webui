import React from "react";
import { HandleChange } from "../types/HandleChange";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "../lib/utils";

export const SeedInput = <
  T extends {
    use_random_seed?: boolean;
    seed: number | string | undefined;
  },
>({
  params,
  handleChange,
  className,
}: {
  params: T;
  handleChange: HandleChange;
  className?: string;
}) => (
  <div className={cn("flex gap-2 items-center w-full", className)}>
    <label className="text-base">Seed:</label>
    <input
      type="number"
      name="seed"
      value={params.seed}
      onChange={handleChange}
      maxLength={10}
      className="border border-gray-300 p-2 rounded text-base w-36"
    />

    <Switch
      id="randomize"
      checked={params.use_random_seed}
      onCheckedChange={(value) =>
        handleChange({
          target: {
            name: "use_random_seed",
            value,
          },
        })
      }
    />
    <Label htmlFor="randomize">Randomize</Label>
  </div>
);
