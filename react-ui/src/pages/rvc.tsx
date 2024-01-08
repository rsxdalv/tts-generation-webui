import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import { RVCParams, RVCId, initialState } from "../tabs/RVCParams";
import { GradioFile } from "../types/GradioFile";

type Result = {
  audio: GradioFile;
  metadata: {
    original_audio_path: string;
    index_path: string;
    model_path: string;
    f0method: string;
    f0up_key: string;
    index_rate: number;
    device: string;
    is_half: boolean;
    filter_radius: number;
    resample_sr: number;
    rms_mix_rate: number;
    protect: number;
  };
};

const initialHistory = []; // prevent infinite loop
const RvcGenerationPage = () => {
  const [historyData, setHistoryData] = useLocalStorage<Result[]>(
    "rvcGenerationHistory",
    initialHistory
  );
  const [data, setData] = useLocalStorage<Result | null>(
    "rvcGenerationOutput",
    null
  );
  const [rvcGenerationParams, setRvcGenerationParams] =
    useLocalStorage<RVCParams>(RVCId, initialState);
  const [loading, setLoading] = React.useState<boolean>(false);

  async function rvcGeneration() {
    setLoading(true);
    const response = await fetch("/api/gradio/rvc", {
      method: "POST",
      body: JSON.stringify(rvcGenerationParams),
    });

    const result = await response.json();
    setData(result);
    setHistoryData((historyData) => [result, ...historyData]);
    setLoading(false);
  }

  // const favorite = async (_url: string, data?: Result) => {
  //   const history_bundle_name_data = data?.bundle_name;
  //   if (!history_bundle_name_data) return;
  //   const response = await fetch("/api/gradio/bark_favorite", {
  //     method: "POST",
  //     body: JSON.stringify({
  //       history_bundle_name_data,
  //     }),
  //   });
  //   const result = await response.json();
  //   console.log(result);
  // };

  const useParameters = (_url: string, data?: Result) => {
    const {
      f0up_key: pitch_up_key,
      original_audio_path: original_audio,
      index_path: index,
      f0method: pitch_collection_method,
      model_path: model,
      index_rate: search_feature_ratio,
      device,
      is_half: use_half_precision_model,
      filter_radius: filter_radius_pitch,
      resample_sr: resample_sample_rate_bug,
      rms_mix_rate: voice_envelope_normalizaiton,
      protect: protect_breath_sounds,
    } = data?.metadata ?? {};

    setRvcGenerationParams({
      ...rvcGenerationParams,
      pitch_up_key: pitch_up_key ?? rvcGenerationParams.pitch_up_key,
      // original_audio,
      index: index ?? rvcGenerationParams.index,
      pitch_collection_method:
        pitch_collection_method ?? rvcGenerationParams.pitch_collection_method,
      model: model ?? rvcGenerationParams.model,
      search_feature_ratio:
        search_feature_ratio ?? rvcGenerationParams.search_feature_ratio,
      device: device ?? rvcGenerationParams.device,
      use_half_precision_model:
        use_half_precision_model ??
        rvcGenerationParams.use_half_precision_model,
      filter_radius_pitch:
        filter_radius_pitch ?? rvcGenerationParams.filter_radius_pitch,
      resample_sample_rate_bug:
        resample_sample_rate_bug ??
        rvcGenerationParams.resample_sample_rate_bug,
      voice_envelope_normalizaiton:
        voice_envelope_normalizaiton ??
        rvcGenerationParams.voice_envelope_normalizaiton,
      protect_breath_sounds:
        protect_breath_sounds ?? rvcGenerationParams.protect_breath_sounds,
    });
  };

  const funcs = [useParameters];

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    setRvcGenerationParams({
      ...rvcGenerationParams,
      [name]:
        type === "number" || type === "range"
          ? Number(value)
          : type === "checkbox"
          ? (event.target as HTMLInputElement).checked // type assertion
          : value,
    });
  };

  return (
    <Template>
      <Head>
        <title>RVC - TTS Generation Webui</title>
      </Head>
      <div className="flex w-full flex-col">
        <RVCParameters
          rvcParams={rvcGenerationParams}
          handleChange={handleChange}
        />
        <div className="flex flex-col space-y-4">
          <button
            className="border border-gray-300 p-2 rounded hover:bg-gray-100"
            onClick={rvcGeneration}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
          <AudioOutput
            audioOutput={data?.audio}
            label="Rvc Output"
            funcs={funcs}
            metadata={data}
            filter={["sendToRvc", "sendToRvcVoiceGeneration"]}
          />
        </div>
        <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
          <label className="text-sm">History:</label>
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={() => {
              setHistoryData([]);
            }}
          >
            Clear History
          </button>
          <div className="flex flex-col space-y-2">
            {historyData &&
              historyData.map((item, index) => (
                <AudioOutput
                  key={index}
                  audioOutput={item.audio}
                  // label={item.}
                  label={`History ${index}`}
                  funcs={funcs}
                  metadata={item}
                  filter={["sendToRvc", "sendToRvcVoiceGeneration"]}
                />
              ))}
          </div>
        </div>
      </div>
      {/* <pre>{JSON.stringify(rvcGenerationParams, null, 2)}</pre> */}
    </Template>
  );
};

export default RvcGenerationPage;

const Model = ({
  rvcParams: rvcGenerationParams,
  handleChange,
}: {
  rvcParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchOptions = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/rvc_model_reload", {
      method: "POST",
    });

    const result = await response.json();
    setOptions(result);
    setLoading(false);
  };

  const openModels = async () => {
    await fetch("/api/gradio/rvc_model_open", {
      method: "POST",
    });
  };

  React.useEffect(() => {
    fetchOptions();
  }, []);

  const selected = rvcGenerationParams?.model;
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
      {/* <div className="flex gap-2">
        <label className="text-sm">Upload:</label>
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
      </div> */}
    </div>
  );
};

// Like model but for Index
const Index = ({
  rvcParams: rvcGenerationParams,
  handleChange,
}: {
  rvcParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchOptions = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/rvc_index_reload", {
      method: "POST",
    });

    const result = await response.json();
    setOptions(result);
    setLoading(false);
  };

  const openModels = async () => {
    await fetch("/api/gradio/rvc_index_open", {
      method: "POST",
    });
  };

  React.useEffect(() => {
    fetchOptions();
  }, []);

  const selected = rvcGenerationParams?.index;
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex gap-2">
        <label className="text-sm">Index:</label>
        <select
          name="index"
          id="index"
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
      {/* <div className="flex gap-2">
        <label className="text-sm">Upload:</label>
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
      </div> */}
    </div>
  );
};

const RvcPrompt = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) => (
  <GenericPromptRvc
    name="prompt"
    label="Prompt"
    handleChange={handleChange}
    rvcGenerationParams={rvcGenerationParams}
  />
);

const RvcInput = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
  setRvcGenerationParams: (rvcGenerationParams: RVCParams) => void;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
  data?: Result | null;
}) => {
  return (
    <div className="flex flex-col w-full space-y-2">
      <div className="flex flex-row space-x-2">
        <div className="space-y-2 w-1/2">
          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <Model
              rvcParams={rvcGenerationParams}
              handleChange={handleChange}
            />
          </div>
          <AutoRegressiveParameters
            rvcGenerationParams={rvcGenerationParams}
            handleChange={handleChange}
          />
        </div>
        <div className="space-y-2 w-1/2">
          <DiffusionParameters
            rvcGenerationParams={rvcGenerationParams}
            handleChange={handleChange}
          />
        </div>
      </div>
      <RvcPrompt
        rvcGenerationParams={rvcGenerationParams}
        handleChange={handleChange}
      />
    </div>
  );
};

const RVCParameters = ({
  rvcParams,
  handleChange,
}: {
  rvcParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => {
  return (
    <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
      <label className="text-sm">RVC Parameters:</label>
      <Model rvcParams={rvcParams} handleChange={handleChange} />
      <Index rvcParams={rvcParams} handleChange={handleChange} />
      <AudioInput
        callback={(original_audio?: string) => {
          handleChange({
            target: {
              name: "original_audio",
              value: original_audio,
            },
          } as React.ChangeEvent<HTMLInputElement>);
        }}
        label="Original Audio"
        filter={["sendToRvc"]}
        url={rvcParams?.original_audio}
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col space-y-2">
          <div className="flex gap-2">
            <div className="flex flex-col">
              <label className="text-sm">Pitch Up key:</label>
              <input
                type="text"
                name="pitch_up_key"
                value={rvcParams.pitch_up_key}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm">Pitch Collection Method:</label>
              <select
                name="pitch_collection_method"
                id="pitch_collection_method"
                className="border border-gray-300 p-2 rounded text-black w-full"
                value={rvcParams?.pitch_collection_method}
                onChange={handleChange}
              >
                {["harvest", "pm", "crepe"].map((pitch_collection_method) => (
                  <option
                    key={pitch_collection_method}
                    value={pitch_collection_method}
                  >
                    {pitch_collection_method}
                  </option>
                ))}
              </select>
            </div>
            {/* search feature ratio */}
            <GenericSlider
              rvcParams={rvcParams}
              handleChange={handleChange}
              label="Search Feature Ratio"
              name="search_feature_ratio"
              min="0.0"
              max="1.0"
              step="0.01"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-sm">Device:</label>
            <select
              name="device"
              id="device"
              className="border border-gray-300 p-2 rounded text-black w-full"
              value={rvcParams?.device}
              onChange={handleChange}
            >
              {["cuda:0", "cpu", "mps"].map((device) => (
                <option key={device} value={device}>
                  {device}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col space-y-2">
            <GenericSlider
              rvcParams={rvcParams}
              handleChange={handleChange}
              label="Filter Radius (Pitch)"
              name="filter_radius_pitch"
              min="0"
              max="10"
              step="1"
            />
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          {/* <div className="flex flex-col space-y-2">
            <GenericSlider
              rvcParams={rvcParams}
              handleChange={handleChange}
              label="Resample Sample-rate (Bug)"
              name="resample_sample_rate_bug"
              min="0"
              max="48000"
              step="1"
            />
          </div> */}
          <div className="flex flex-col space-y-2">
            <GenericSlider
              rvcParams={rvcParams}
              handleChange={handleChange}
              label="Voice Envelope Normalizaiton"
              name="voice_envelope_normalizaiton"
              min="0.0"
              max="1.0"
              step="0.01"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <GenericSlider
              rvcParams={rvcParams}
              handleChange={handleChange}
              label="Protect Breath Sounds"
              name="protect_breath_sounds"
              min="0.0"
              max="0.5"
              step="0.01"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const GenericPromptRvc = ({
  rvcGenerationParams,
  handleChange,
  label,
  name,
}: {
  rvcGenerationParams: RVCParams;
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label: string;
  name: string;
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm">{label}:</label>
      <textarea
        name={name}
        value={rvcGenerationParams[name]}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded resize-none"
        placeholder="Enter text here..."
        rows={3}
      />
    </div>
  );
};

const GenericSlider = ({
  rvcParams: rvcGenerationParams,
  handleChange,
  label,
  name,
  min,
  max,
  step,
}: {
  rvcParams: RVCParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  name: string;
  min: string;
  max: string;
  step: string;
}) => {
  return (
    <div className="flex flex-col border border-gray-300 p-2 rounded">
      <label className="text-sm">
        {label}: {rvcGenerationParams[name]}
      </label>
      <input
        type="range"
        name={name}
        value={rvcGenerationParams[name]}
        onChange={handleChange}
        className="border border-gray-300 py-2 rounded"
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
};

const SamplesSlider = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <GenericSlider
    rvcParams={rvcGenerationParams}
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
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <GenericSlider
    rvcParams={rvcGenerationParams}
    handleChange={handleChange}
    label="Temperature"
    name="temperature"
    min="0.0"
    max="1.0"
    step="0.01"
  />
);

const LengthPenaltySlider = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <GenericSlider
    rvcParams={rvcGenerationParams}
    handleChange={handleChange}
    label="Length Penalty"
    name="length_penalty"
    min="0.0"
    max="10.0"
    step="0.01"
  />
);

const RepetitionPenaltySlider = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    rvcParams={rvcGenerationParams}
    handleChange={handleChange}
    label="Repetition Penalty"
    name="repetition_penalty"
    min="0.0"
    max="10.0"
    step="0.01"
  />
);

const TopPSlider = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    rvcParams={rvcGenerationParams}
    handleChange={handleChange}
    label="Top P"
    name="top_p"
    min="0.0"
    max="1.0"
    step="0.01"
  />
);

const MaxMelTokensSlider = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    rvcParams={rvcGenerationParams}
    handleChange={handleChange}
    label="Max Mel Tokens"
    name="max_mel_tokens"
    min="0"
    max="600"
    step="1"
  />
);

const AutoRegressiveParameters = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
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
        rvcGenerationParams={rvcGenerationParams}
        handleChange={handleChange}
      />
      <TemperatureSlider
        rvcGenerationParams={rvcGenerationParams}
        handleChange={handleChange}
      />
      <LengthPenaltySlider
        rvcGenerationParams={rvcGenerationParams}
        handleChange={handleChange}
      />
      <RepetitionPenaltySlider
        rvcGenerationParams={rvcGenerationParams}
        handleChange={handleChange}
      />
      <TopPSlider
        rvcGenerationParams={rvcGenerationParams}
        handleChange={handleChange}
      />
      <MaxMelTokensSlider
        rvcGenerationParams={rvcGenerationParams}
        handleChange={handleChange}
      />
    </div>
  );
};

const DiffusionIterationsSlider = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    rvcParams={rvcGenerationParams}
    handleChange={handleChange}
    label="Diffusion Iterations"
    name="diffusion_iterations"
    min="0"
    max="400"
    step="1"
  />
);

const CondFreeKSlider = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    rvcParams={rvcGenerationParams}
    handleChange={handleChange}
    label="Cond Free K"
    name="cond_free_k"
    min="0"
    max="10"
    step="1"
  />
);

const DiffusionTemperatureSlider = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <GenericSlider
    rvcParams={rvcGenerationParams}
    handleChange={handleChange}
    label="Diffusion Temperature"
    name="diffusion_temperature"
    min="0.0"
    max="1.0"
    step="0.01"
  />
);

const DiffusionParameters = ({
  rvcGenerationParams,
  handleChange,
}: {
  rvcGenerationParams: RVCParams;
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
        rvcGenerationParams={rvcGenerationParams}
        handleChange={handleChange}
      />
      <CondFreeKSlider
        rvcGenerationParams={rvcGenerationParams}
        handleChange={handleChange}
      />
      <DiffusionTemperatureSlider
        rvcGenerationParams={rvcGenerationParams}
        handleChange={handleChange}
      />
    </div>
  );
};
