import React from "react";
import { GenerationRaw } from "../types/Generation";

const Row = ({
  label,
  value,
  longValue,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  longValue?: string;
}) => (
  <div className="flex flex-row">
    <div className="font-bold">{label}:</div>
    <div title={longValue} className="ml-1">
      {value}
    </div>
  </div>
);

export const Metadata = ({
  text,
  seed,
  hash,
  model,
  duration,
  topk,
  topp,
  temperature,
  cfg_coef,
  melody,
  _audiocraft_version = "0.0.1",
}: Omit<GenerationRaw, "language" | "date" | "filename">) => (
  <div className="text-xs text-gray-500 flex flex-col w-full break-words">
    <div className="font-bold">Generation details:</div>
    <div className="flex flex-col">
      <Row label="Prompt" value={text} />
      <Row label="Seed" value={seed} />
      <Row
        label="Hash"
        value={hash ? hash.slice(0, 16) + "..." : "unknown"}
        longValue={hash}
      />
      <Row
        label="Melody Hash"
        value={melody ? melody.slice(0, 16) + "..." : "None"}
        longValue={model}
      />
      <Row label="Model" value={model} />
      <Row label="Duration" value={duration} />
      <Row label="Top K" value={topk} />
      <Row label="Top P" value={topp} />
      <Row label="Temperature" value={temperature} />
      <Row label="CFG Coef" value={cfg_coef} />
      <Row label="Audiocraft Version" value={_audiocraft_version} />
    </div>
  </div>
);
