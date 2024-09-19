import React from "react";
import { HandleChange } from "../types/HandleChange";
import { Label } from "./ui/label";
import { cn } from "../lib/utils";
import { Textarea } from "./ui/textarea";

export const PromptTextArea = <
  T extends { [key: string]: number | string | boolean },
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
  <div className={cn("flex flex-col gap-2", className)}>
    <Label htmlFor={name as string}>{label}:</Label>
    <Textarea
      id={name as string}
      name={name as string}
      value={params[name] as string}
      onChange={handleChange}
      className="cell"
      placeholder="Enter text here..."
      rows={3}
    />
  </div>
);
