import React from "react";
import { TortoiseGenerationParams } from "../tabs/TortoiseGenerationParams";
import FileInput from "./FileInput";
import { TortoiseResult } from "../tabs/TortoiseResult";
import { GenericSlider } from "./GenericSlider";

export const TortoiseInput = ({
  tortoiseGenerationParams,
  setTortoiseGenerationParams,
  handleChange,
  data,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  setTortoiseGenerationParams: (
    tortoiseGenerationParams: TortoiseGenerationParams
  ) => void;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
  data?: TortoiseResult | null;
}) => {
  return (
    <div className="flex flex-col w-full space-y-2">
      <div className="flex flex-row space-x-2">
        <div className="space-y-2 w-1/2">
          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <Model
              tortoiseGenerationParams={tortoiseGenerationParams}
              handleChange={handleChange}
            />
          </div>
          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <Speaker
              tortoiseGenerationParams={tortoiseGenerationParams}
              handleChange={handleChange}
            />
          </div>
          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <Preset
              tortoiseGenerationParams={tortoiseGenerationParams}
              handleChange={handleChange}
            />
          </div>
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
          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <CVVPAmount
              tortoiseGenerationParams={tortoiseGenerationParams}
              handleChange={handleChange}
            />
            <SplitPrompt
              tortoiseGenerationParams={tortoiseGenerationParams}
              handleChange={handleChange}
            />
            <Seed
              tortoiseGenerationParams={tortoiseGenerationParams}
              setTortoiseGenerationParams={setTortoiseGenerationParams}
              handleChange={handleChange}
              lastSeed={Number(data?.seed) || -1}
            />
          </div>
          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <GenerationName
              tortoiseGenerationParams={tortoiseGenerationParams}
              handleChange={handleChange}
            />
          </div>
        </div>
      </div>
      <TortoisePrompt
        tortoiseGenerationParams={tortoiseGenerationParams}
        handleChange={handleChange}
      />
    </div>
  );
};
const Speaker = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
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
  handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <div>
    <label className="text-sm">Preset:</label>
    <select
      name="preset"
      id="preset"
      className="border border-gray-300 p-2 rounded text-black w-full"
      value={tortoiseGenerationParams?.preset}
      onChange={handleChange}
    >
      {["ultra_fast", "fast", "standard", "high_quality"].map((preset) => (
        <option key={preset} value={preset}>
          {preset}
        </option>
      ))}
    </select>
  </div>
);
const CVVPAmount = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
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
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
const CondFree = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
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
};
const Model = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
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
    handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="flex items-center space-x-2">
      <label className="text-sm">{label}:</label>
      <input
        type="checkbox"
        name={name}
        checked={tortoiseGenerationParams[name]}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded"
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
      <div className="grid grid-cols-2 gap-2">
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
          {/* Apply Model Settings */}
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
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
const TortoisePrompt = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) => (
  <GenericPromptTortoise
    name="prompt"
    label="Prompt"
    handleChange={handleChange}
    tortoiseGenerationParams={tortoiseGenerationParams}
  />
);
const Seed = ({
  tortoiseGenerationParams,
  setTortoiseGenerationParams,
  handleChange,
  lastSeed,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  setTortoiseGenerationParams: (
    tortoiseGenerationParams: TortoiseGenerationParams
  ) => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  lastSeed?: number;
}) => {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm">Seed:</label>
      <input
        type="text"
        name="seed_input"
        value={tortoiseGenerationParams.seed}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded"
      />
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={() => {
          setTortoiseGenerationParams({
            ...tortoiseGenerationParams,
            seed: lastSeed ?? -1,
          });
        }}
      >
        Restore Last
      </button>
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={() => {
          setTortoiseGenerationParams({
            ...tortoiseGenerationParams,
            // seed_input: randomSeed().toString(),
            seed: -1,
          });
        }}
      >
        Randomize
      </button>
    </div>
  );
};
const GenericPromptTortoise = ({
  tortoiseGenerationParams,
  handleChange,
  label,
  name,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label: string;
  name: string;
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm">{label}:</label>
      <textarea
        name={name}
        value={tortoiseGenerationParams[name]}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded resize-none"
        placeholder="Enter text here..."
        rows={3}
      />
    </div>
  );
};

//   autoregressive
// samples: 4,
// temperature: 0.8,
// length_penalty: 1.0,
// repetition_penalty: 2.0,
// top_p: 0.8,
// max_mel_tokens: 500,
const SamplesSlider = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
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
);
const TemperatureSlider = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <GenericSlider
    params={tortoiseGenerationParams}
    handleChange={handleChange}
    label="Temperature"
    name="temperature"
    min="0.0"
    max="1.0"
    step="0.01"
  />
);
const LengthPenaltySlider = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <GenericSlider
    params={tortoiseGenerationParams}
    handleChange={handleChange}
    label="Length Penalty"
    name="length_penalty"
    min="0.0"
    max="10.0"
    step="0.01"
  />
);
const RepetitionPenaltySlider = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    params={tortoiseGenerationParams}
    handleChange={handleChange}
    label="Repetition Penalty"
    name="repetition_penalty"
    min="0.0"
    max="10.0"
    step="0.01"
  />
);
const TopPSlider = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    params={tortoiseGenerationParams}
    handleChange={handleChange}
    label="Top P"
    name="top_p"
    min="0.0"
    max="1.0"
    step="0.01"
  />
);
const MaxMelTokensSlider = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    params={tortoiseGenerationParams}
    handleChange={handleChange}
    label="Max Mel Tokens"
    name="max_mel_tokens"
    min="0"
    max="600"
    step="1"
  />
);
const AutoRegressiveParameters = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => {
  return (
    <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded">
      {/* Autoregressive Parameters */}
      <h2 className="text-md">Autoregressive Parameters</h2>
      <SamplesSlider
        tortoiseGenerationParams={tortoiseGenerationParams}
        handleChange={handleChange}
      />
      <TemperatureSlider
        tortoiseGenerationParams={tortoiseGenerationParams}
        handleChange={handleChange}
      />
      <LengthPenaltySlider
        tortoiseGenerationParams={tortoiseGenerationParams}
        handleChange={handleChange}
      />
      <RepetitionPenaltySlider
        tortoiseGenerationParams={tortoiseGenerationParams}
        handleChange={handleChange}
      />
      <TopPSlider
        tortoiseGenerationParams={tortoiseGenerationParams}
        handleChange={handleChange}
      />
      <MaxMelTokensSlider
        tortoiseGenerationParams={tortoiseGenerationParams}
        handleChange={handleChange}
      />
    </div>
  );
};
const DiffusionIterationsSlider = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    params={tortoiseGenerationParams}
    handleChange={handleChange}
    label="Diffusion Iterations"
    name="diffusion_iterations"
    min="0"
    max="400"
    step="1"
  />
);
const CondFreeKSlider = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    params={tortoiseGenerationParams}
    handleChange={handleChange}
    label="Cond Free K"
    name="cond_free_k"
    min="0"
    max="10"
    step="1"
  />
);
const DiffusionTemperatureSlider = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    params={tortoiseGenerationParams}
    handleChange={handleChange}
    label="Diffusion Temperature"
    name="diffusion_temperature"
    min="0.0"
    max="1.0"
    step="0.01"
  />
);
const DiffusionParameters = ({
  tortoiseGenerationParams,
  handleChange,
}: {
  tortoiseGenerationParams: TortoiseGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => {
  return (
    <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded">
      {/* Diffusion Parameters */}
      <h2 className="text-md">Diffusion Parameters</h2>
      <DiffusionIterationsSlider
        tortoiseGenerationParams={tortoiseGenerationParams}
        handleChange={handleChange}
      />
      <CondFree
        tortoiseGenerationParams={tortoiseGenerationParams}
        handleChange={handleChange}
      />
      <CondFreeKSlider
        tortoiseGenerationParams={tortoiseGenerationParams}
        handleChange={handleChange}
      />
      <DiffusionTemperatureSlider
        tortoiseGenerationParams={tortoiseGenerationParams}
        handleChange={handleChange}
      />
    </div>
  );
};
