import React from "react";
import { MagnetParams, MagnetResult } from "../tabs/MagnetParams";
import { MagnetModelSelector } from "./MagnetModelSelector";
import { GenericSlider } from "./GenericSlider";

const SeedInput = ({
  magnetParams,
  handleChange,
  setMagnetParams,
  seed,
}: {
  magnetParams: MagnetParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setMagnetParams: React.Dispatch<React.SetStateAction<MagnetParams>>;
  seed: number | string | undefined;
}) => (
  <>
    <label className="text-sm">Seed:</label>
    <input
      type="number"
      name="seed"
      value={magnetParams.seed}
      onChange={handleChange}
      className="border border-gray-300 p-2 rounded"
    />
    <button
      className="border border-gray-300 p-2 rounded"
      onClick={() =>
        setMagnetParams({
          ...magnetParams,
          seed: Number(seed) || -1,
        })
      }
    >
      Restore Last Seed
    </button>
  </>
);

export const MagnetInputs = ({
  magnetParams,
  handleChange,
  setMagnetParams,
  data,
}: {
  magnetParams: MagnetParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
  setMagnetParams: React.Dispatch<React.SetStateAction<MagnetParams>>;
  data: MagnetResult | null;
}) => {
  return (
    <div className="flex gap-x-6 w-full justify-center">
      <div className="flex flex-col gap-y-2 w-1/2">
        <label className="text-sm">Text:</label>
        <textarea
          name="text"
          value={magnetParams.text}
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded"
          placeholder="Enter text here..."
          rows={3}
        />

        <MagnetModelSelector
          magnetParams={magnetParams}
          setMagnetParams={setMagnetParams}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <label className="text-sm">Top-K:</label>
        <input
          type="number"
          name="top_k"
          value={magnetParams.top_k}
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded"
          min="0"
          max="250"
          step="1"
        />

        <GenericSlider
          label="Top-P"
          name="top_p"
          params={magnetParams}
          handleChange={handleChange}
          min="0"
          max="1.5"
          step="0.01"
        />

        <GenericSlider
          label="Temperature"
          name="temperature"
          params={magnetParams}
          handleChange={handleChange}
          min="0"
          max="10"
          step="0.01"
        />

        <div className="flex gap-2">
          <GenericSlider
            label="Min Cfg Coef"
            name="min_cfg_coef"
            params={magnetParams}
            handleChange={handleChange}
            className="w-1/2"
            min="0"
            max="100"
            step="0.1"
          />
          <GenericSlider
            label="Max Cfg Coef"
            name="max_cfg_coef"
            params={magnetParams}
            handleChange={handleChange}
            className="w-1/2"
            min="0"
            max="100"
            step="0.1"
          />
        </div>

        <label className="text-sm">
          Decoding Steps:{" "}
          {[
            magnetParams.decoding_steps_1,
            magnetParams.decoding_steps_2,
            magnetParams.decoding_steps_3,
            magnetParams.decoding_steps_4,
          ].join(", ")}
        </label>
        <GenericSlider
          label="Decoding Steps (1)"
          name="decoding_steps_1"
          params={magnetParams}
          handleChange={handleChange}
          min="0"
          max="100"
          step="1"
        />
        <GenericSlider
          label="Decoding Steps (2)"
          name="decoding_steps_2"
          params={magnetParams}
          handleChange={handleChange}
          min="0"
          max="100"
          step="1"
        />
        <GenericSlider
          label="Decoding Steps (3)"
          name="decoding_steps_3"
          params={magnetParams}
          handleChange={handleChange}
          min="0"
          max="100"
          step="1"
        />
        <GenericSlider
          label="Decoding Steps (4)"
          name="decoding_steps_4"
          params={magnetParams}
          handleChange={handleChange}
          min="0"
          max="100"
          step="1"
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm">Span Arrangement:</label>
          <div className="flex gap-x-4">
            {["nonoverlap", "overlap"].map((type) => (
              <div key={type} className="flex items-center">
                <input
                  type="radio"
                  name="span_arrangement"
                  id={type}
                  value={type}
                  checked={magnetParams.span_arrangement === type}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded"
                />
                <label className="ml-1 select-none" htmlFor={type}>
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm">Use Sampling:</label>
          <input
            type="checkbox"
            name="use_sampling"
            checked={magnetParams.use_sampling}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
        </div>

        <SeedInput
          magnetParams={magnetParams}
          handleChange={handleChange}
          setMagnetParams={setMagnetParams}
          seed={data?.json?.seed}
        />
      </div>
    </div>
  );
};
