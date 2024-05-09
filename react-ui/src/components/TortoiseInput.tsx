import React from "react";
import { TortoiseGenerationParams } from "../tabs/TortoiseGenerationParams";
import FileInput from "./FileInput";
import { TortoiseResult } from "../tabs/TortoiseResult";
import { GenericSlider } from "./GenericSlider";
import { HandleChange } from "../types/HandleChange";
import { PromptTextArea } from "./PromptTextArea";
import { SeedInput } from "./SeedInput";

const SimpleGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
    {children}
  </div>
);

export const TortoiseInput = ({
  tortoiseGenerationParams,
  setTortoiseGenerationParams,
  handleChange,
  data,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  setTortoiseGenerationParams: React.Dispatch<
    React.SetStateAction<TortoiseGenerationParams>
  >;
  handleChange: HandleChange;
  data?: TortoiseResult | null;
}) => (
  <div className="flex flex-col w-full space-y-2">
    <div className="flex flex-row space-x-2">
      <div className="space-y-2 w-1/2">
        <SimpleGroup>
          <Model
            tortoiseGenerationParams={tortoiseGenerationParams}
            handleChange={handleChange}
          />
        </SimpleGroup>
        <SimpleGroup>
          <Speaker
            tortoiseGenerationParams={tortoiseGenerationParams}
            handleChange={handleChange}
          />
        </SimpleGroup>
        <SimpleGroup>
          <Preset
            tortoiseGenerationParams={tortoiseGenerationParams}
            handleChange={handleChange}
          />
        </SimpleGroup>
        <AutoRegressiveParameters
          tortoiseGenerationParams={tortoiseGenerationParams}
          handleChange={handleChange}
        />
      </div>
      <div className="space-y-2 w-1/2">
        <DiffusionParameters
          tortoiseGenerationParams={tortoiseGenerationParams}
          handleChange={handleChange}
        />
        <SimpleGroup>
          <CVVPAmount
            tortoiseGenerationParams={tortoiseGenerationParams}
            handleChange={handleChange}
          />
          <SplitPrompt
            tortoiseGenerationParams={tortoiseGenerationParams}
            handleChange={handleChange}
          />
          <SeedInput
            params={tortoiseGenerationParams}
            setParams={setTortoiseGenerationParams}
            handleChange={handleChange}
            seed={data?.seed}
          />
        </SimpleGroup>
        <SimpleGroup>
          <GenerationName
            tortoiseGenerationParams={tortoiseGenerationParams}
            handleChange={handleChange}
          />
        </SimpleGroup>
      </div>
    </div>
    <PromptTextArea
      name="prompt"
      label="Prompt"
      handleChange={handleChange}
      params={tortoiseGenerationParams}
    />
  </div>
);
const Speaker = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: HandleChange;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchOptions = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/tortoise_refresh_voices", {
      method: "POST",
    });

    const result = await response.json();
    setOptions(result);
    setLoading(false);
  };

  const openVoices = async () => {
    await fetch("/api/gradio/tortoise_open_voices", {
      method: "POST",
    });
  };

  React.useEffect(() => {
    fetchOptions();
  }, []);

  const selected = tortoiseGenerationParams?.speaker;
  return (
    <div className="flex gap-2">
      <label className="text-sm">Speaker:</label>
      <select
        name="speaker"
        id="speaker"
        className="border border-gray-300 p-2 rounded text-black w-full"
        value={selected}
        onChange={handleChange}
      >
        {options
          // concat to ensure selected is at the top and present
          .filter((option) => option !== selected)
          .concat(selected)
          .map((bandwidth) => (
            <option key={bandwidth} value={bandwidth}>
              {bandwidth}
            </option>
          ))}
      </select>
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={openVoices}
      >
        Open
      </button>
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={fetchOptions}
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
};
const Preset = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: HandleChange;
}) => (
  <div className="flex items-center space-x-2">
    <label className="text-sm">Preset:</label>
    <div className="flex flex-row space-x-2">
      {["ultra_fast", "fast", "standard", "high_quality"].map((preset) => (
        <div key={preset} className="flex items-center">
          <input
            type="radio"
            name="preset"
            id={preset}
            value={preset}
            checked={tortoiseGenerationParams.preset === preset}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded"
          />
          <label className="ml-1" htmlFor={preset}>
            {preset}
          </label>
        </div>
      ))}
    </div>
  </div>
);
const CVVPAmount = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: HandleChange;
}) => (
  <GenericSlider
    params={tortoiseGenerationParams}
    handleChange={handleChange}
    label="CVVP Amount"
    name="cvvp_amount"
    min="0.0"
    max="1.0"
    step="0.01"
  />
);
const SplitPrompt = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: HandleChange;
}) => {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm">Split prompt by lines:</label>
      <input
        type="checkbox"
        name="split_prompt"
        checked={tortoiseGenerationParams.split_prompt}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded"
      />
    </div>
  );
};
const Model = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: HandleChange;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [applyModelSettingsLoading, setApplyModelSettingsLoading] =
    React.useState<boolean>(false);

  const fetchOptions = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/tortoise_refresh_models", {
      method: "POST",
    });

    const result = await response.json();
    setOptions(result);
    setLoading(false);
  };

  const openModels = async () => {
    await fetch("/api/gradio/tortoise_open_models", {
      method: "POST",
    });
  };

  const applyModelSettings = async () => {
    setApplyModelSettingsLoading(true);
    const params = {
      model: tortoiseGenerationParams.model,
      kv_cache: tortoiseGenerationParams.kv_cache,
      use_deepspeed: tortoiseGenerationParams.use_deepspeed,
      half: tortoiseGenerationParams.half,
      tokenizer: tortoiseGenerationParams.tokenizer,
      use_basic_cleaners: tortoiseGenerationParams.use_basic_cleaners,
    };
    const response = await fetch("/api/gradio/tortoise_apply_model_settings", {
      method: "POST",
      body: JSON.stringify(params),
    });
    const result = await response.json();
    console.log(result);
    setApplyModelSettingsLoading(false);
  };

  const BasicModelCheckbox = ({
    name,
    label,
    handleChange,
  }: {
    name: string;
    label: string;
    handleChange: HandleChange;
  }) => (
    <div className="flex items-center space-x-2">
      <label className="text-sm cursor-pointer" htmlFor={name}>
        {label}:
      </label>
      <input
        type="checkbox"
        name={name}
        id={name}
        checked={tortoiseGenerationParams[name]}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded cursor-pointer"
      />
    </div>
  );

  React.useEffect(() => {
    fetchOptions();
  }, []);

  const selected = tortoiseGenerationParams?.model;
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex gap-2">
        <label className="text-sm">Model:</label>
        <select
          name="model"
          id="model"
          className="border border-gray-300 p-2 rounded text-black w-full"
          value={selected}
          onChange={handleChange}
        >
          {options
            // concat to ensure selected is at the top and present
            .filter((option) => option !== selected)
            .concat(selected)
            .map((bandwidth) => (
              <option key={bandwidth} value={bandwidth}>
                {bandwidth}
              </option>
            ))}
        </select>
        <button
          className="border border-gray-300 p-2 rounded"
          onClick={openModels}
        >
          Open
        </button>
        <button
          className="border border-gray-300 p-2 rounded"
          onClick={fetchOptions}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {/* 2x2 */}
      {/* <div className="grid grid-cols-2 gap-2"> */}
      <div className="flex gap-4">
        <BasicModelCheckbox
          name="kv_cache"
          label="KV Cache"
          handleChange={handleChange}
        />
        <BasicModelCheckbox
          name="use_deepspeed"
          label="Use Deepspeed"
          handleChange={handleChange}
        />
        <BasicModelCheckbox
          name="half"
          label="Half"
          handleChange={handleChange}
        />
        <BasicModelCheckbox
          name="use_basic_cleaners"
          label="Use basic cleaners"
          handleChange={handleChange}
        />
      </div>

      <div className="flex gap-2">
        <label className="text-sm">Tokenizer:</label>
        {/* <input
              type="text"
              name="tokenizer"
              value={tortoiseGenerationParams.tokenizer}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded"
            /> */}
        <FileInput
          accept=".json"
          callback={(tokenizer) => {
            handleChange({
              target: {
                name: "tokenizer",
                value: tokenizer,
              },
            } as React.ChangeEvent<HTMLInputElement>);
          }}
          hide_text={false}
        />
      </div>
      <div className="flex flex-col space-y-2">
        <button
          className="border border-gray-300 p-2 rounded"
          onClick={applyModelSettings}
        >
          {applyModelSettingsLoading ? "Applying..." : "Apply Model Settings"}
        </button>
      </div>
    </div>
  );
};
const GenerationName = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: HandleChange;
}) => (
  <div className="flex items-center space-x-2">
    <label className="text-sm">Generation Name:</label>
    <input
      type="text"
      name="generation_name"
      value={tortoiseGenerationParams.generation_name}
      onChange={handleChange}
      className="border border-gray-300 p-2 rounded"
    />
  </div>
);

const AutoRegressiveParameters = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: HandleChange;
}) => (
  <SimpleGroup>
    <h2 className="text-md">Autoregressive Parameters</h2>
    <GenericSlider
      params={tortoiseGenerationParams}
      handleChange={handleChange}
      label="Samples"
      name="samples"
      // min="1" - needs to be at least GPU batch sized
      min="4"
      max="256"
      step="1"
    />
    <GenericSlider
      params={tortoiseGenerationParams}
      handleChange={handleChange}
      label="Temperature"
      format={(x) => x.toFixed(2)}
      name="temperature"
      min="0.0"
      max="1.0"
      step="0.01"
    />
    <GenericSlider
      params={tortoiseGenerationParams}
      handleChange={handleChange}
      label="Length Penalty"
      name="length_penalty"
      min="0.0"
      max="10.0"
      step="0.01"
    />
    <GenericSlider
      params={tortoiseGenerationParams}
      handleChange={handleChange}
      label="Repetition Penalty"
      name="repetition_penalty"
      min="0.0"
      max="10.0"
      step="0.01"
    />
    <GenericSlider
      params={tortoiseGenerationParams}
      handleChange={handleChange}
      label="Top P"
      name="top_p"
      min="0.0"
      max="1.0"
      step="0.01"
    />
    <GenericSlider
      params={tortoiseGenerationParams}
      handleChange={handleChange}
      label="Max Mel Tokens"
      name="max_mel_tokens"
      min="0"
      max="600"
      step="1"
    />
  </SimpleGroup>
);

const CondFree = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="flex items-center space-x-2">
    <label className="text-sm">Cond Free:</label>
    <input
      type="checkbox"
      name="cond_free"
      checked={tortoiseGenerationParams.cond_free}
      onChange={handleChange}
      className="border border-gray-300 p-2 rounded"
    />
  </div>
);

const DiffusionParameters = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: HandleChange;
}) => (
  <SimpleGroup>
    <h2 className="text-md">Diffusion Parameters</h2>
    <GenericSlider
      params={tortoiseGenerationParams}
      handleChange={handleChange}
      label="Diffusion Iterations"
      name="diffusion_iterations"
      min="0"
      max="400"
      step="1"
    />
    <CondFree
      tortoiseGenerationParams={tortoiseGenerationParams}
      handleChange={handleChange}
    />
    <GenericSlider
      params={tortoiseGenerationParams}
      handleChange={handleChange}
      label="Cond Free K"
      name="cond_free_k"
      min="0"
      max="10"
      step="1"
    />
    <GenericSlider
      params={tortoiseGenerationParams}
      handleChange={handleChange}
      label="Diffusion Temperature"
      format={(x) => x.toFixed(2)}
      name="diffusion_temperature"
      min="0.0"
      max="1.0"
      step="0.01"
    />
  </SimpleGroup>
);
