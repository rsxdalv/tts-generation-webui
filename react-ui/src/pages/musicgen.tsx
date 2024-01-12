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

const modelNameMapping = {
  Melody: "facebook/musicgen-melody",
  Medium: "facebook/musicgen-medium",
  Small: "facebook/musicgen-small",
  Large: "facebook/musicgen-large",
  Audiogen: "facebook/audiogen-medium",
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

  async function musicgen() {
    const body = JSON.stringify({
      ...musicgenParams,
      melody: musicgenParams.model === "Melody" ? musicgenParams.melody : null,
      model: modelNameMapping[musicgenParams.model],
    });
    const response = await fetch("/api/gradio/musicgen", {
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
      model:
        Object.keys(modelNameMapping).find(
          (key) => modelNameMapping[key] === params.model
        ) || "Small",
    });
  };

  // const funcs = [useAsMelody, favorite, useSeed, useParameters];
  const funcs = {
    // prevent minification
    useAsMelody,
    favorite,
    useSeed,
    useParameters,
  }

  return (
    <Template>
      <Head>
        <title>Musicgen - TTS Generation Webui</title>
      </Head>
      <div className="p-4">
        <div className="my-4">
          <div className="flex space-x-6 w-full">
            <div className="flex flex-col space-y-2">
              <label className="text-sm">Text:</label>
              <textarea
                name="text"
                value={musicgenParams.text}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
                placeholder="Enter text here..."
                rows={3}
              />

              <div className="space-y-2">
                <label className="text-sm">Model:</label>
                <div className="flex flex-row space-x-2">
                  {["Melody", "Small", "Medium", "Large", "Audiogen"].map(
                    (model) => (
                      <div key={model} className="flex items-center">
                        <input
                          type="radio"
                          name="model"
                          id={model}
                          value={model}
                          checked={musicgenParams.model === model}
                          onChange={handleChange}
                          className="border border-gray-300 p-2 rounded"
                        />
                        <label className="ml-1" htmlFor={model}>
                          {model}
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>
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

            <div className="flex flex-col space-y-2">
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

              <div className="flex space-x-2 items-center">
                <label className="text-sm">
                  Use{" "}
                  <a
                    className="underline"
                    href="https://huggingface.co/facebook/multiband-diffusion"
                    target="_blank"
                  >
                    Multi Band Diffusion:
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
            </div>
          </div>
        </div>

        <div className="my-4 flex flex-col space-y-2">
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

        <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
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
          <div className="flex flex-col space-y-2">
            {historyData &&
              historyData.map((item, index) => (
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
