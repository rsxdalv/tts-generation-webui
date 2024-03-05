import React from "react";
import { Template } from "../components/Template";
import Head from "next/head";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import {
  MusicgenParams,
  initialMusicgenParams,
  musicgenId,
} from "../tabs/MusicgenParams";
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
    melody?: any;
    text: string;
    model: string;
    duration: number;
    topk: number;
    topp: number;
    temperature: number;
    cfg_coef: number;
    seed: string;
    use_multi_band_diffusion: boolean;
  };
};

const modelMap = {
  Small: { size: "small", stereo: true, melody: false },
  Medium: { size: "medium", stereo: true, melody: true },
  Large: { size: "large", stereo: true, melody: true },
  Audiogen: { size: "audiogen", stereo: false, melody: false },
};

const modelToType = {
  "facebook/musicgen-small": "Small",
  "facebook/musicgen-medium": "Medium",
  "facebook/musicgen-large": "Large",
  "facebook/audiogen-medium": "Audiogen",

  "facebook/musicgen-melody": "Medium",
  "facebook/musicgen-melody-large": "Large",

  "facebook/musicgen-stereo-small": "Small",
  "facebook/musicgen-stereo-medium": "Medium",
  "facebook/musicgen-stereo-large": "Large",

  "facebook/musicgen-stereo-melody": "Medium",
  "facebook/musicgen-stereo-melody-large": "Large",
};

const computeModel = (type: string, stereo: boolean, melody: boolean) => {
  const lowerType = type.toLowerCase();
  const largeSuffix = type === "Large" ? "-large" : "";
  const stereoPrefix = stereo ? "-stereo" : "";

  return type === "Audiogen"
    ? `facebook/audiogen-medium`
    : melody && type !== "Small"
    ? `facebook/musicgen${stereoPrefix}-melody${largeSuffix}`
    : `facebook/musicgen${stereoPrefix}-${lowerType}`;
};

const getType = (model: string) => {
  return modelToType[model] || "Small";
};

const decomputeModel = (
  model: string
): { type: string; stereo: boolean; melody: boolean } => {
  const type = getType(model);
  const stereo = model.includes("stereo");
  const melody = model.includes("melody");
  return { type, stereo, melody };
};

const ModelSelector = ({
  musicgenParams,
  setMusicgenParams,
}: {
  musicgenParams: MusicgenParams;
  setMusicgenParams: React.Dispatch<React.SetStateAction<MusicgenParams>>;
}) => {
  const {
    type: modelType,
    stereo,
    melody,
  } = decomputeModel(musicgenParams.model);

  const { stereo: stereoAvailable, melody: melodyAvailable } =
    modelMap[modelType];

  return (
    <div className="flex flex-col border border-gray-300 p-2 rounded text-md">
      <div className="text-md">Model:</div>
      <div className="flex gap-2">
        <label className="text-md">Size:</label>
        <div className="flex gap-x-2">
          {["Small", "Medium", "Large", "Audiogen"].map((model) => (
            <div key={model} className="flex items-center">
              <input
                type="radio"
                name="size"
                id={model}
                value={model}
                checked={modelType === model}
                onChange={(event) => {
                  const newModel = event.target.value;
                  setMusicgenParams({
                    ...musicgenParams,
                    model: computeModel(newModel, stereo, melody),
                  });
                }}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="ml-1 select-none" htmlFor={model}>
                {model}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <label className="text-md">Stereo:</label>
        <input
          type="checkbox"
          name="stereo"
          checked={stereo}
          onChange={() => {
            setMusicgenParams({
              ...musicgenParams,
              model: computeModel(modelType, !stereo, melody),
            });
          }}
          className="border border-gray-300 p-2 rounded"
          disabled={!stereoAvailable}
        />
        <label className="text-md">Use Melody:</label>
        <input
          type="checkbox"
          name="melody"
          checked={melody}
          onChange={() => {
            setMusicgenParams({
              ...musicgenParams,
              model: computeModel(modelType, stereo, !melody),
            });
          }}
          className="border border-gray-300 p-2 rounded"
          disabled={!melodyAvailable}
        />
      </div>
    </div>
  );
};

const initialMusicgenHyperParams = {
  iterations: 1,
  splitByLines: false,
};

const initialHistory = []; // prevent infinite loop
const MusicgenPage = () => {
  const [data, setData] = useLocalStorage<Result | null>(
    "musicgenGenerationOutput",
    null
  );
  const [historyData, setHistoryData] = useLocalStorage<Result[]>(
    "musicgenHistory",
    initialHistory
  );
  const [musicgenParams, setMusicgenParams] = useLocalStorage<MusicgenParams>(
    musicgenId,
    initialMusicgenParams
  );
  // hyperparameters
  const [musicgenHyperParams, setMusicgenHyperParams] = useLocalStorage<
    typeof initialMusicgenHyperParams
  >("musicgenHyperParams", initialMusicgenHyperParams);
  const [showLast, setShowLast] = useLocalStorage<number>(
    "musicgenShowLast",
    10
  );
  const interrupted = React.useRef(false);

  const [progress, setProgress] = React.useState(0);
  const [progressMax, setProgressMax] = React.useState(0);

  async function musicgen() {
    interrupted.current = false;
    const texts = musicgenHyperParams.splitByLines
      ? musicgenParams.text.split("\n")
      : [musicgenParams.text];

    const incrementNonRandomSeed = (seed: number, iteration: number) => {
      return seed === -1 ? -1 : seed + iteration;
    };

    const musicgenIteration = async (text, iteration: number) => {
      const result = await musicgenGenerate({
        ...musicgenParams,
        text,
        seed: incrementNonRandomSeed(musicgenParams.seed, iteration),
      });
      setData(result);
      setHistoryData((x) => [result, ...x]);
    };

    setProgress(0);
    setProgressMax(texts.length * musicgenHyperParams.iterations);
    for (
      let iteration = 0;
      iteration < musicgenHyperParams.iterations;
      iteration++
    ) {
      for (const text of texts) {
        if (interrupted.current) {
          return;
        }
        await musicgenIteration(text, iteration);
        setProgress((x) => x + 1);
      }
    }
    interrupted.current = false;
    setProgress(0);
    setProgressMax(0);
  }

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    setMusicgenParams({
      ...musicgenParams,
      [name]:
        type === "number" || type === "range"
          ? Number(value)
          : type === "checkbox"
          ? (event.target as HTMLInputElement).checked // type assertion
          : value,
    });
  };

  const useAsMelody = (melody?: string, metadata?: Result) => {
    if (!melody) return;
    setMusicgenParams({
      ...musicgenParams,
      melody,
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
    setMusicgenParams({
      ...musicgenParams,
      seed: Number(seed),
    });
  };

  const useParameters = (_url: string, data?: Result) => {
    const params = data?.json;
    if (!params) return;
    setMusicgenParams({
      ...musicgenParams,
      ...params,
      seed: Number(params.seed),
      model: params.model || "facebook/musicgen-small",
    });
  };

  const funcs = {
    useAsMelody,
    favorite,
    useSeed,
    useParameters,
  };

  const interrupt = () => (interrupted.current = true);

  return (
    <Template>
      <Head>
        <title>Musicgen - TTS Generation Webui</title>
      </Head>
      <div className="p-4">
        <div className="my-4">
          <div className="flex gap-x-6 w-full justify-center">
            <div className="flex flex-col gap-y-2 w-1/2">
              <label className="text-sm">Text:</label>
              <textarea
                name="text"
                value={musicgenParams.text}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
                placeholder="Enter text here..."
                rows={3}
              />

              <ModelSelector
                musicgenParams={musicgenParams}
                setMusicgenParams={setMusicgenParams}
              />
              <AudioInput
                url={musicgenParams.melody}
                label="Melody"
                callback={(file) => {
                  setMusicgenParams({
                    ...musicgenParams,
                    melody: file,
                  });
                }}
                filter={["sendToMusicgen"]}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm">
                Duration: {musicgenParams.duration}s{" "}
                {musicgenParams.duration > 30 && "(spliced)"}
              </label>
              <input
                type="range"
                name="duration"
                value={musicgenParams.duration}
                onChange={handleChange}
                className="border border-gray-300 py-2 rounded"
                min="0.5"
                max="360"
                step="0.5"
              />

              <label className="text-sm">Top-K:</label>
              <input
                type="number"
                name="topk"
                value={musicgenParams.topk}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
                min="0"
                max="250"
                step="1"
              />

              <label className="text-sm">Top-P: {musicgenParams.topp}</label>
              <input
                type="range"
                name="topp"
                value={musicgenParams.topp}
                onChange={handleChange}
                className="border border-gray-300 py-2 rounded"
                min="0"
                max="1.5"
                step="0.01"
              />

              <label className="text-sm">
                Temperature: {musicgenParams.temperature}
              </label>
              <input
                type="range"
                name="temperature"
                value={musicgenParams.temperature}
                onChange={handleChange}
                className="border border-gray-300 py-2 rounded"
                min="0"
                max="1.5"
                step="0.01"
              />

              <label className="text-sm">
                Classifier Free Guidance Coefficient:{" "}
                {musicgenParams.cfg_coef.toFixed(1)}
              </label>
              <input
                type="range"
                name="cfg_coef"
                value={musicgenParams.cfg_coef}
                onChange={handleChange}
                className="border border-gray-300 py-2 rounded"
                min="0"
                max="10"
                step="0.1"
              />

              <label className="text-sm">Seed:</label>
              <input
                type="number"
                name="seed"
                value={musicgenParams.seed}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
              <button
                className="border border-gray-300 p-2 rounded"
                onClick={() =>
                  setMusicgenParams({
                    ...musicgenParams,
                    seed: Number(data?.json.seed) || -1,
                  })
                }
              >
                Restore Last Seed
              </button>

              <div className="flex gap-x-2 items-center">
                <label className="text-sm">
                  Use{" "}
                  <a
                    className="underline"
                    href="https://huggingface.co/facebook/multiband-diffusion"
                    target="_blank"
                  >
                    Multi Band Diffusion (High VRAM Usage):
                  </a>
                </label>
                <input
                  type="checkbox"
                  name="use_multi_band_diffusion"
                  checked={musicgenParams.use_multi_band_diffusion}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded"
                />
              </div>

              <HyperParameters
                params={musicgenHyperParams}
                setParams={setMusicgenHyperParams}
                progress={progress}
                progressMax={progressMax}
                interrupted={interrupted}
                interrupt={interrupt}
              />
              <button
                className="border border-gray-300 p-2 rounded"
                onClick={() => {
                  setMusicgenParams(initialMusicgenParams);
                  setMusicgenHyperParams(initialMusicgenHyperParams);
                }}
              >
                Reset Parameters
              </button>
            </div>
          </div>
        </div>

        <div className="my-4 flex flex-col gap-y-2">
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={musicgen}
          >
            Generate
          </button>
          <AudioOutput
            audioOutput={data?.audio}
            label="Musicgen Output"
            funcs={funcs}
            metadata={data}
            filter={["sendToMusicgen"]}
          />
        </div>

        <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded">
          <label className="text-sm">History:</label>
          <div className="flex gap-x-2 items-center">
            <button
              className="border border-gray-300 p-2 px-40 rounded"
              onClick={() => {
                setHistoryData([]);
              }}
            >
              Clear History
            </button>
            <div className="flex gap-x-2 items-center">
              <label className="text-sm">Show Last X entries:</label>
              <input
                type="number"
                value={showLast}
                onChange={(event) => setShowLast(Number(event.target.value))}
                className="border border-gray-300 p-2 rounded"
                min="0"
                max="100"
                step="1"
              />
            </div>
          </div>
          <div className="flex flex-col gap-y-2">
            {historyData &&
              historyData
                .slice(1, showLast + 1)
                .map((item, index) => (
                  <AudioOutput
                    key={index}
                    audioOutput={item.audio}
                    metadata={item}
                    label={item.history_bundle_name_data}
                    funcs={funcs}
                    filter={["sendToMusicgen"]}
                  />
                ))}
          </div>
        </div>
      </div>
    </Template>
  );
};

export default MusicgenPage;

async function musicgenGenerate(musicgenParams: MusicgenParams) {
  const body = JSON.stringify({
    ...musicgenParams,
    melody: musicgenParams.model.includes("melody")
      ? musicgenParams.melody
      : null,
    model: musicgenParams.model,
  });
  const response = await fetch("/api/gradio/musicgen", {
    method: "POST",
    body,
  });

  return (await response.json()) as Result;
}

const HyperParameters = ({
  params: musicgenHyperParams,
  setParams: setMusicgenHyperParams,
  progress,
  progressMax,
  interrupted,
  interrupt,
}: {
  params: typeof initialMusicgenHyperParams;
  setParams: React.Dispatch<
    React.SetStateAction<typeof initialMusicgenHyperParams>
  >;
  progress: number;
  progressMax: number;
  interrupted: React.MutableRefObject<boolean>;
  interrupt: () => void;
}) => (
  <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded">
    <label className="text-sm">Hyperparameters:</label>
    <div className="flex gap-x-2 items-center">
      <label className="text-sm">Iterations:</label>
      <input
        type="number"
        name="iterations"
        value={musicgenHyperParams.iterations}
        onChange={(event) => {
          setMusicgenHyperParams({
            ...musicgenHyperParams,
            iterations: Number(event.target.value),
          });
        }}
        className="border border-gray-300 p-2 rounded"
        min="1"
        max="10"
        step="1"
      />
    </div>
    <div className="flex gap-x-2 items-center">
      <div className="text-sm">Each line as a separate prompt:</div>
      <input
        type="checkbox"
        name="splitByLines"
        checked={musicgenHyperParams.splitByLines}
        onChange={(event) => {
          setMusicgenHyperParams({
            ...musicgenHyperParams,
            splitByLines: event.target.checked,
          });
        }}
        className="border border-gray-300 p-2 rounded"
      />
    </div>
    <Progress progress={progress} progressMax={progressMax} />
    <button className="border border-gray-300 p-2 rounded" onClick={interrupt}>
      {interrupted.current ? "Interrupted..." : "Interrupt"}
    </button>
  </div>
);

const Progress = ({
  progress,
  progressMax,
}: {
  progress: number;
  progressMax: number;
}) => (
  <div className="flex gap-x-2 items-center">
    <label className="text-sm">Progress:</label>
    <progress
      value={progress}
      max={progressMax}
      className="[&::-webkit-progress-bar]:rounded [&::-webkit-progress-value]:rounded   [&::-webkit-progress-bar]:bg-slate-300 [&::-webkit-progress-value]:bg-orange-400 [&::-moz-progress-bar]:bg-orange-400 [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-200"
    />
    {progress}/{progressMax}
  </div>
);
