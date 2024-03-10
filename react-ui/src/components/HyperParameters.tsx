import React from "react";
import { Progress } from "./Progress";

export const HyperParameters = <
  T extends {
    iterations: number;
    splitByLines: boolean;
  }
>({
  params,
  setParams,
  progress,
  progressMax,
  isInterrupted: interrupted,
  interrupt,
}: {
  params: T;
  setParams: React.Dispatch<React.SetStateAction<T>>;
  progress: number;
  progressMax: number;
  isInterrupted: boolean;
  interrupt: () => void;
}) => (
  <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded">
    <label className="text-sm">Hyperparameters:</label>
    <div className="flex gap-x-2 items-center">
      <label className="text-sm">Iterations:</label>
      <input
        type="number"
        name="iterations"
        value={params.iterations}
        onChange={(event) => {
          setParams({
            ...params,
            iterations: Number(event.target.value),
          });
        }}
        className="border border-gray-300 p-2 rounded"
        min="1"
        max="10"
        step="1"
      />
    </div>
    <div className="flex gap-x-2 items-center">
      <div className="text-sm">Each line as a separate prompt:</div>
      <input
        type="checkbox"
        name="splitByLines"
        checked={params.splitByLines}
        onChange={(event) => {
          setParams({
            ...params,
            splitByLines: event.target.checked,
          });
        }}
        className="border border-gray-300 p-2 rounded"
      />
    </div>
    <Progress progress={progress} progressMax={progressMax} />
    <button className="border border-gray-300 p-2 rounded" onClick={interrupt}>
      {interrupted ? "Interrupted..." : "Interrupt"}
    </button>
  </div>
);
