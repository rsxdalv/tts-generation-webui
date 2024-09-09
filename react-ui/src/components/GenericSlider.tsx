import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { HandleChange } from "../types/HandleChange";

const LabelledSlider = ({
  min,
  max,
  name,
  label,
  value,
  decimals = 0,
  className,
  onChange,
  ...props
}: {
  min: number;
  max: number;
  step: number;
  className?: string;
  label: string;
  name: string;
  decimals?: number;
  value: number;
  onChange: HandleChange;
  disabled?: boolean;
}) => (
  <div className="grid gap-2 w-full">
    <div className="flex gap-2 justify-between items-center">
      <Label htmlFor={name}>{label}</Label>
      <Input
        type="number"
        id={name}
        name={name}
        min={min}
        max={max}
        {...props}
        value={value}
        onChange={onChange}
        className="w-16 text-right"
      />
    </div>
    <Slider
      min={min}
      max={max}
      name={name}
      {...props}
      value={[value]}
      className="w-full"
      onValueChange={(values) =>
        onChange({
          target: {
            name,
            value: values[0].toString(),
            type: "number",
          },
        })
      }
    >
      <div>
        <div className="bg-primary" />
      </div>
      <div className="bg-primary-foreground" />
    </Slider>
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>{min.toFixed(decimals)}</span>
      <span>{max.toFixed(decimals)}</span>
    </div>
  </div>
);

export const ParameterSlider = <
  T extends {
    [key: string]: number | string | boolean;
  },
>({
  params,
  onChange,
  label,
  name,
  min,
  max,
  step,
  className,
  decimals = 0,
  disabled = false,
}: {
  params: T;
  onChange: HandleChange;
  label: string;
  name: keyof T;
  min: string | number;
  max: string | number;
  step: string | number;
  className?: string;
  decimals?: number;
  disabled?: boolean;
}) => (
  <LabelledSlider
    value={params[name] as number}
    min={Number(min)}
    max={Number(max)}
    step={Number(step)}
    name={name as string}
    onChange={onChange}
    className={className}
    label={label}
    decimals={decimals}
    disabled={disabled}
  />
);
