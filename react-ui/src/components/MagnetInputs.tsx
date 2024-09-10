import React from "react";
import { MagnetParams } from "../tabs/MagnetParams";
import { MagnetModelSelector } from "./MagnetModelSelector";
import { ParameterSlider } from "./GenericSlider";
import { HandleChange } from "../types/HandleChange";
import { PromptTextArea } from "./PromptTextArea";
import { SeedInput } from "./SeedInput";
import { SimpleGroup } from "./SimpleGroup";
import { commonBorder } from "./commonBorder";
import { RadioWithLabel } from "./component/RadioWithLabel";
import { SwitchWithLabel } from "./SwitchWithLabel";

export const MagnetInputs = ({
  magnetParams: params,
  handleChange: onChange,
}: {
  magnetParams: MagnetParams;
  handleChange: HandleChange;
}) => (
  <div className="flex flex-col w-full gap-y-4">
    <div className="flex gap-x-6 w-full justify-center">
      <div className="flex flex-col gap-y-2 w-1/2">
        <MagnetModelSelector magnetParams={params} handleChange={onChange} />
        <SimpleGroup>
          <div className="flex gap-2 w-full justify-between">
            <ParameterSlider
              label="Top-K"
              name="top_k"
              params={params}
              onChange={onChange}
              min="0"
              max="250"
              step="1"
            />
            <ParameterSlider
              label="Top-P"
              decimals={2}
              name="top_p"
              params={params}
              onChange={onChange}
              min="0"
              max="1.5"
              step="0.01"
            />
            <ParameterSlider
              label="Temperature"
              decimals={2}
              name="temperature"
              params={params}
              onChange={onChange}
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
              params={params}
              onChange={onChange}
              min="0"
              max="100"
              step="0.1"
            />
            <ParameterSlider
              label="Max Cfg Coef"
              decimals={1}
              name="max_cfg_coef"
              params={params}
              onChange={onChange}
              min="0"
              max="100"
              step="0.1"
            />
          </div>
        </SimpleGroup>
      </div>
      <div className="flex flex-col gap-y-2 w-1/2">
        <div className={"flex flex-col gap-y-2 " + commonBorder}>
          <label className="text-sm">
            Decoding Steps:{" "}
            {[
              params.decoding_steps_1,
              params.decoding_steps_2,
              params.decoding_steps_3,
              params.decoding_steps_4,
            ].join(", ")}
          </label>
          <div className="flex gap-2">
            <ParameterSlider
              label="Decoding Steps (1)"
              name="decoding_steps_1"
              params={params}
              onChange={onChange}
              min="0"
              max="100"
              step="1"
            />
            <ParameterSlider
              label="Decoding Steps (2)"
              name="decoding_steps_2"
              params={params}
              onChange={onChange}
              min="0"
              max="100"
              step="1"
            />
          </div>
          <div className="flex gap-2">
            <ParameterSlider
              label="Decoding Steps (3)"
              name="decoding_steps_3"
              params={params}
              onChange={onChange}
              min="0"
              max="100"
              step="1"
            />
            <ParameterSlider
              label="Decoding Steps (4)"
              name="decoding_steps_4"
              params={params}
              onChange={onChange}
              min="0"
              max="100"
              step="1"
            />
          </div>
          <RadioWithLabel
            label="Span Arrangement"
            name="span_arrangement"
            inline
            value={params.span_arrangement}
            onChange={onChange}
            options={[
              { label: "Non-overlap", value: "nonoverlap" },
              { label: "Overlap", value: "overlap" },
            ]}
          />
          <SwitchWithLabel
            label="Use Sampling"
            name="use_sampling"
            value={params.use_sampling}
            onChange={onChange}
          />
        </div>
        <SeedInput params={params} handleChange={onChange} />
      </div>
    </div>
    <PromptTextArea
      handleChange={onChange}
      label="Text"
      params={params}
      name="text"
    />
  </div>
);
