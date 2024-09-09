import React from "react";
import { MagnetParams } from "../tabs/MagnetParams";
import { MagnetModelSelector } from "./MagnetModelSelector";
import { ParameterSlider } from "./GenericSlider";
import { HandleChange } from "../types/HandleChange";
import { PromptTextArea } from "./PromptTextArea";
import { SeedInput } from "./SeedInput";
import { SimpleGroup } from "./SimpleGroup";

export const MagnetInputs = ({
  magnetParams,
  handleChange,
}: {
  magnetParams: MagnetParams;
  handleChange: HandleChange;
}) => (
  <div className="flex flex-col w-full gap-y-4">
    <div className="flex gap-x-6 w-full justify-center">
      <div className="flex flex-col gap-y-2 w-1/2">
        <MagnetModelSelector
          magnetParams={magnetParams}
          handleChange={handleChange}
        />
        <SimpleGroup>
          <div className="flex gap-2 w-full justify-between">
            <ParameterSlider
              label="Top-K"
              name="top_k"
              params={magnetParams}
              onChange={handleChange}
              className="w-1/2"
              min="0"
              max="250"
              step="1"
            />
            <ParameterSlider
              label="Top-P"
              decimals={2}
              name="top_p"
              params={magnetParams}
              onChange={handleChange}
              className="w-1/2"
              min="0"
              max="1.5"
              step="0.01"
            />
            <ParameterSlider
              label="Temperature"
              decimals={2}
              name="temperature"
              params={magnetParams}
              onChange={handleChange}
              className="w-1/2"
              min="0"
              max="10"
              step="0.01"
            />
          </div>
          <div className="flex gap-2">
            <ParameterSlider
              label="Min Cfg Coef"
              decimals={1}
              name="min_cfg_coef"
              params={magnetParams}
              onChange={handleChange}
              className="w-1/2"
              min="0"
              max="100"
              step="0.1"
            />
            <ParameterSlider
              label="Max Cfg Coef"
              decimals={1}
              name="max_cfg_coef"
              params={magnetParams}
              onChange={handleChange}
              className="w-1/2"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
        </SimpleGroup>
      </div>
      <div className="flex flex-col gap-y-2 w-1/2">
        <label className="text-sm">
          Decoding Steps:{" "}
          {[
            magnetParams.decoding_steps_1,
            magnetParams.decoding_steps_2,
            magnetParams.decoding_steps_3,
            magnetParams.decoding_steps_4,
          ].join(", ")}
        </label>
        <div className="flex gap-2">
          <ParameterSlider
            label="Decoding Steps (1)"
            name="decoding_steps_1"
            params={magnetParams}
            onChange={handleChange}
            className="w-1/2"
            min="0"
            max="100"
            step="1"
          />
          <ParameterSlider
            label="Decoding Steps (2)"
            name="decoding_steps_2"
            params={magnetParams}
            onChange={handleChange}
            className="w-1/2"
            min="0"
            max="100"
            step="1"
          />
        </div>
        <div className="flex gap-2">
          <ParameterSlider
            label="Decoding Steps (3)"
            name="decoding_steps_3"
            params={magnetParams}
            onChange={handleChange}
            className="w-1/2"
            min="0"
            max="100"
            step="1"
          />
          <ParameterSlider
            label="Decoding Steps (4)"
            name="decoding_steps_4"
            params={magnetParams}
            onChange={handleChange}
            className="w-1/2"
            min="0"
            max="100"
            step="1"
          />
        </div>
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
        <SeedInput params={magnetParams} handleChange={handleChange} />
      </div>
    </div>
    <PromptTextArea
      handleChange={handleChange}
      label="Text"
      params={magnetParams}
      name="text"
    />
  </div>
);
