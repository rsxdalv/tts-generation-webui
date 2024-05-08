import React from "react";

export const GenericSlider = <
  T extends {
    [key: string]: number | string | boolean;
  }
>({
  params,
  handleChange,
  label,
  name,
  min,
  max,
  step,
  className,
  format = (x) => x.toString(),
  border = false,
  horizontal = false,
}: {
  params: T;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  name: keyof T;
  min: string;
  max: string;
  step: string;
  className?: string;
  format?: (value: number) => string;
  border?: boolean;
  horizontal?: boolean;
}) => {
  const value = params[name] as number;
  return (
    <div
      className={`flex ${horizontal ? "flex-row" : "flex-col"} ${
        border ? "border border-gray-300" : ""
      } p-2 rounded ${className}`}
    >
      <label className="text-sm">
        {label}: {format(value)}
      </label>
      <input
        type="range"
        name={name as string}
        value={value}
        onChange={handleChange}
        className={`${border ? "border border-gray-300" : ""} py-2 rounded`}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
};
