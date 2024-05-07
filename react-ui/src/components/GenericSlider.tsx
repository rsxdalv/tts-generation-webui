import React from "react";

export const GenericSlider = <
  T extends {
    [key: string]: number | string | boolean;
  }
>({
  params, handleChange, label, name, min, max, step, className,
}: {
  params: T;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  name: keyof T;
  min: string;
  max: string;
  step: string;
  className?: string;
}) => {
  const value = params[name] as number;
  return (
    <div
      className={`flex flex-col border border-gray-300 p-2 rounded ${className}`}
    >
      <label className="text-sm">
        {label}: {value}
      </label>
      <input
        type="range"
        name={name as string}
        value={value}
        onChange={handleChange}
        className="border border-gray-300 py-2 rounded"
        min={min}
        max={max}
        step={step} />
    </div>
  );
};
