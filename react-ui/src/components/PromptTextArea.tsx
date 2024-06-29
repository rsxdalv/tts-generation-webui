import React from "react";
import { HandleChange } from "../types/HandleChange";

export const PromptTextArea = <
  T extends { [key: string]: number | string | boolean }
>({
  params,
  handleChange,
  label,
  name,
  className,
}: {
  params: T;
  handleChange: HandleChange;
  label: string;
  name: keyof T;
  className?: string;
}) => (
  <div className={`flex flex-col space-y-2 ${className}`}>
    <label className="text-sm">{label}:</label>
    <textarea
      name={name as string}
      value={params[name] as string}
      onChange={handleChange}
      className="border border-gray-300 p-2 rounded resize-none"
      placeholder="Enter text here..."
      rows={3}
    />
  </div>
);
