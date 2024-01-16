import React from "react";
import { Template } from "../components/Template";
import Head from "next/head";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import {
  MagnetParams,
  initialMagnetParams,
  magnetId,
} from "../tabs/MagnetParams";
import { GradioFile } from "../types/GradioFile";

type AudioOutput = {
  name: string;
  data: string;
  size?: number;
  is_file?: boolean;
  orig_name?: string;
  type_name?: string;
};

type Result = {
  audio: GradioFile;
  history_bundle_name_data: string;
  json: {
    _version: string;
    _hash_version: string;
    _type: string;
    _audiocraft_version: string;
    models: {};
    prompt: string;
    hash: string;
    date: string;
    model: string;
    text: string;
    seed: string;
    use_sampling: boolean;
    top_k: number;
    top_p: number;
    temperature: number;
    max_cfg_coef: number;
    min_cfg_coef: number;
    decoding_steps: number[];
    span_arrangement: string;
  };
};

const modelMap = {
  Small: { size: "small", 10: true, 30: true },
  Medium: { size: "medium", 10: true, 30: true },
  Audio: { size: "audio", 10: true, 30: false },
};

const canUseDuration = (type: string, isAudio: boolean, duration: string) => {
  const subType = isAudio ? "Audio" : type;
  const { [duration]: canUse } = modelMap[subType];
  return canUse;
};

const modelToType = {
  "facebook/magnet-small-10secs": "Small",
  "facebook/magnet-medium-10secs": "Medium",
  "facebook/magnet-small-30secs": "Small",
  "facebook/magnet-medium-30secs": "Medium",
  "facebook/audio-magnet-small": "Small",
  "facebook/audio-magnet-medium": "Medium",
};

const computeModel = (type: string, isAudio: boolean, duration: number) => {
  const lowerType = type.toLowerCase();
  const durationSuffix = duration === 30 ? "-30secs" : "-10secs";

  return isAudio
    ? `facebook/audio-magnet-${lowerType}`
    : `facebook/magnet-${lowerType}${durationSuffix}`;
};

const getType = (model: string) => {
  return modelToType[model] || "Small";
};

const decomputeModel = (
  model: string
): { type: string; isAudio: boolean; duration: number } => {
  const type = getType(model);
  const duration = model.includes("-30secs") ? 30 : 10;
  const isAudio = model.includes("audio");
  return { type, isAudio, duration };
};

const ModelSelector = ({
  magnetParams,
  setMagnetParams,
}: {
  magnetParams: MagnetParams;
  setMagnetParams: React.Dispatch<React.SetStateAction<MagnetParams>>;
}) => {
  const {
    type: modelType,
    isAudio,
    duration,
  } = decomputeModel(magnetParams.model);

  return (
    <div className="flex flex-col border border-gray-300 p-2 rounded text-md gap-2">
      <div className="text-md">Model:</div>
      <Model
        params={magnetParams}
        handleChange={(event) =>
          setMagnetParams({
            ...magnetParams,
            model: event.target.value,
          })
        }
      />
      <div className="flex gap-2">
        <label className="text-md">Size:</label>
        <div className="flex gap-x-2">
          {["Small", "Medium"].map((type) => (
            <div key={type} className="flex items-center">
              <input
                type="radio"
                name="size"
                id={type}
                value={type}
                checked={modelType === type}
                onChange={(event) =>
                  setMagnetParams({
                    ...magnetParams,
                    model: computeModel(event.target.value, isAudio, duration),
                  })
                }
                className="border border-gray-300 p-2 rounded"
              />
              <label className="ml-1 select-none" htmlFor={type}>
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>
      {/* <div className="flex gap-2 items-center">
        <label className="text-md">Audio:</label>
        <input
          type="checkbox"
          name="isAudio"
          id="isAudio"
          checked={isAudio}
          onChange={(event) =>
            setMagnetParams({
              ...magnetParams,
              model: computeModel(modelType, event.target.checked, duration),
            })
          }
          className="border border-gray-300 p-2 rounded"
        />
      </div> */}
      {/* Instead of a checkbox make it a radio between Audio and Music */}
      <div className="flex gap-2">
        <label className="text-md">Audio:</label>
        <div className="flex gap-x-2">
          {["Music", "Audio"].map((type) => (
            <div key={type} className="flex items-center">
              <input
                type="radio"
                name="audio"
                id={type}
                value={type}
                checked={isAudio === (type === "Audio")}
                onChange={(event) =>
                  setMagnetParams({
                    ...magnetParams,
                    model: computeModel(
                      modelType,
                      event.target.value === "Audio",
                      duration
                    ),
                  })
                }
                className="border border-gray-300 p-2 rounded"
              />
              <label className="ml-1 select-none" htmlFor={type}>
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <label className="text-md">Duration:</label>
        <div className="flex gap-x-2">
          {["10", "30"].map((d) => (
            <div key={d} className="flex items-center">
              <input
                type="radio"
                name="duration"
                id={d}
                value={d}
                checked={d === String(duration)}
                onChange={(event) =>
                  setMagnetParams({
                    ...magnetParams,
                    model: computeModel(
                      modelType,
                      isAudio,
                      Number(event.target.value)
                    ),
                  })
                }
                className="border border-gray-300 p-2 rounded"
                disabled={!canUseDuration(modelType, isAudio, d)}
              />
              <label className="ml-1 select-none" htmlFor={d}>
                {d}s
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Model = ({
  params,
  handleChange,
}: {
  params: MagnetParams;
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
    const response = await fetch("/api/gradio/magnet_get_models", {
      method: "POST",
    });

    const result = await response.json();
    setOptions(result);
    setLoading(false);
  };

  const openModels = async () => {
    await fetch("/api/gradio/magnet_open_model_dir", {
      method: "POST",
    });
  };

  React.useEffect(() => {
    fetchOptions();
  }, []);

  const selected = params?.model;
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex gap-2">
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
    </div>
  );
};

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

const initialHistory = []; // prevent infinite loop
const MagnetPage = () => {
  const [data, setData] = useLocalStorage<Result | null>(
    "magnetGenerationOutput",
    null
  );
  const [historyData, setHistoryData] = useLocalStorage<Result[]>(
    "magnetHistory",
    initialHistory
  );
  const [magnetParams, setMagnetParams] = useLocalStorage<MagnetParams>(
    magnetId,
    initialMagnetParams
  );

  async function magnet() {
    const body = JSON.stringify({ ...magnetParams });
    const response = await fetch("/api/gradio/magnet", {
      method: "POST",
      body,
    });

    const result: Result = await response.json();
    setData(result);
    setHistoryData((x) => [result, ...x]);
  }

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    setMagnetParams({
      ...magnetParams,
      [name]:
        type === "number" || type === "range"
          ? Number(value)
          : type === "checkbox"
          ? (event.target as HTMLInputElement).checked // type assertion
          : value,
    });
  };

  const favorite = async (_url: string, data?: Result) => {
    const history_bundle_name_data = data?.history_bundle_name_data;
    if (!history_bundle_name_data) return;
    const response = await fetch("/api/gradio/bark_favorite", {
      method: "POST",
      body: JSON.stringify({
        history_bundle_name_data,
      }),
    });
    const result = await response.json();
    return result;
  };

  const useSeed = (_url: string, data?: Result) => {
    const seed = data?.json.seed;
    if (!seed) return;
    setMagnetParams({
      ...magnetParams,
      seed: Number(seed),
    });
  };

  const useParameters = (_url: string, data?: Result) => {
    const params = data?.json;
    if (!params) return;
    setMagnetParams({
      ...magnetParams,
      ...params,
      seed: Number(params.seed),
      model: params.model || initialMagnetParams.model,
      decoding_steps_1: params.decoding_steps[0],
      decoding_steps_2: params.decoding_steps[1],
      decoding_steps_3: params.decoding_steps[2],
      decoding_steps_4: params.decoding_steps[3],
    });
  };

  const funcs = {
    favorite,
    useSeed,
    useParameters,
  };

  return (
    <Template>
      <Head>
        <title>Magnet - TTS Generation Webui</title>
      </Head>
      <div className="p-4 flex w-full flex-col">
        <MagnetInputs
          magnetParams={magnetParams}
          handleChange={handleChange}
          setMagnetParams={setMagnetParams}
          data={data}
        />

        <div className="my-4 flex flex-col gap-y-2">
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={magnet}
          >
            Generate
          </button>
          <AudioOutput
            audioOutput={data?.audio}
            label="Magnet Output"
            funcs={funcs}
            metadata={data}
            filter={["sendToMagnet"]}
          />
        </div>

        <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded">
          <label className="text-sm">History:</label>
          {/* Clear history */}
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={() => {
              setHistoryData([]);
            }}
          >
            Clear History
          </button>
          <div className="flex flex-col gap-y-2">
            {historyData &&
              historyData
                .slice(1, 6)
                .map((item, index) => (
                  <AudioOutput
                    key={index}
                    audioOutput={item.audio}
                    metadata={item}
                    label={item.history_bundle_name_data}
                    funcs={funcs}
                    filter={["sendToMagnet"]}
                  />
                ))}
          </div>
        </div>
      </div>
    </Template>
  );
};

export default MagnetPage;

const MagnetInputs = ({
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
  data: Result | null;
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

        <ModelSelector
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

        <label className="text-sm">Top-P: {magnetParams.top_p}</label>
        <input
          type="range"
          name="top_p"
          value={magnetParams.top_p}
          onChange={handleChange}
          className="border border-gray-300 py-2 rounded"
          min="0"
          max="1.5"
          step="0.01"
        />

        <label className="text-sm">
          Temperature: {magnetParams.temperature}
        </label>
        <input
          type="range"
          name="temperature"
          value={magnetParams.temperature}
          onChange={handleChange}
          className="border border-gray-300 py-2 rounded"
          min="0"
          max="10"
          step="0.01"
        />

        <div className="flex flex-col gap-2">
          <div className="flex gap-2 justify-between items-center">
            <label className="text-sm">
              Min Cfg Coef: {magnetParams.min_cfg_coef}
            </label>
            <input
              type="range"
              name="min_cfg_coef"
              value={magnetParams.min_cfg_coef}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-1/2"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          <div className="flex gap-2 justify-between items-center">
            <label className="text-sm">
              Max Cfg Coef: {magnetParams.max_cfg_coef}
            </label>
            <input
              type="range"
              name="max_cfg_coef"
              value={magnetParams.max_cfg_coef}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-1/2"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
        </div>

        <label className="text-sm">
          {/* Decoding Steps: {magnetParams.decoding_steps.join(", ")} */}
          Decoding Steps: {magnetParams.decoding_steps_1},{" "}
          {magnetParams.decoding_steps_2}, {magnetParams.decoding_steps_3},{" "}
          {magnetParams.decoding_steps_4}
        </label>
        <input
          type="range"
          name="decoding_steps_1"
          value={magnetParams.decoding_steps_1}
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded"
          min="0"
          max="100"
          step="1"
        />
        <input
          type="range"
          name="decoding_steps_2"
          value={magnetParams.decoding_steps_2}
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded"
          min="0"
          max="100"
          step="1"
        />
        <input
          type="range"
          name="decoding_steps_3"
          value={magnetParams.decoding_steps_3}
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded"
          min="0"
          max="100"
          step="1"
        />
        <input
          type="range"
          name="decoding_steps_4"
          value={magnetParams.decoding_steps_4}
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded"
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
