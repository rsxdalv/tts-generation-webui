import React from "react";

export const Progress = ({
  progress,
  progressMax,
}: {
  progress: number;
  progressMax: number;
}) => (
  <div className="flex gap-x-2 items-center">
    <label className="text-sm">Progress:</label>
    <progress
      value={progress}
      max={progressMax}
      className="[&::-webkit-progress-bar]:rounded [&::-webkit-progress-value]:rounded   [&::-webkit-progress-bar]:bg-slate-300 [&::-webkit-progress-value]:bg-orange-400 [&::-moz-progress-bar]:bg-orange-400 [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-200"
    />
    {progress}/{progressMax}
  </div>
);

export const manageProgress = async (
  callback: (args: { incrementProgress: () => void }) => Promise<void>,
  max: number,
  setProgress: React.Dispatch<
    React.SetStateAction<{ current: number; max: number }>
  >
) => {
  setProgress({ current: 0, max });
  await callback({
    incrementProgress: () =>
      setProgress(({ current, max }) => ({
        current: current + 1,
        max,
      })),
  });
  setProgress({ current: 0, max: 0 });
};
