import React from "react";
import { Template } from "../components/Template";
import Head from "next/head";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioOutput } from "../components/AudioComponents";
import {
  MusicgenParams,
  MusicgenResult,
  musicgenId,
  useMusicgenParams,
  useMusicgenResult,
} from "../tabs/MusicgenParams";
import { HyperParameters } from "../components/HyperParameters";
import { useInterrupt } from "../hooks/useInterrupt";
import {
  initialHyperParams,
  extractTexts,
  getMax,
  incrementNonRandomSeed,
} from "../data/hyperParamsUtils";
import { manageProgress } from "../components/Progress";
import { parseFormChange } from "./parseFormChange";
import { barkFavorite } from "../functions/barkFavorite";
import { generateWithMusicgen } from "../functions/generateWithMusicgen";
import { MusicgenInputs } from "./MusicgenInputs";

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

export const ModelSelector = ({
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

const initialHistory = []; // prevent infinite loop
const MusicgenPage = () => {
  const [musicgenResult, setMusicgenResult] = useMusicgenResult();
  const [historyData, setHistoryData] = useLocalStorage<MusicgenResult[]>(
    "musicgenHistory",
    initialHistory
  );
  const [musicgenParams, setMusicgenParams] = useMusicgenParams();
  const [musicgenHyperParams, setMusicgenHyperParams] = useLocalStorage<
    typeof initialHyperParams
  >("musicgenHyperParams", initialHyperParams);
  const [showLast, setShowLast] = useLocalStorage<number>(
    "musicgenShowLast",
    10
  );

  const { interrupted, resetInterrupt, interrupt } = useInterrupt();
  const [progress, setProgress] = React.useState({ current: 0, max: 0 });

  function musicgenWithProgress() {
    const texts = extractTexts(musicgenParams.text, musicgenHyperParams);
    const { iterations } = musicgenHyperParams;

    return manageProgress(
      ({ incrementProgress }) =>
        musicgenConsumer(
          musicgenGenerator(texts, iterations, musicgenParams),
          incrementProgress
        ),
      getMax(texts, iterations),
      setProgress
    );
  }

  async function* musicgenGenerator(
    texts: string[],
    iterations: number,
    musicgenParams: MusicgenParams
  ) {
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (const text of texts) {
        if (interrupted.current) {
          return;
        }
        yield generateWithMusicgen({
          ...musicgenParams,
          text,
          seed: incrementNonRandomSeed(musicgenParams.seed, iteration),
        });
      }
    }
  }

  async function musicgenConsumer(
    generator: AsyncGenerator<MusicgenResult, void, unknown>,
    callback: (result: MusicgenResult) => void
  ) {
    for await (const result of generator) {
      setMusicgenResult(result);
      setHistoryData((x) => [result, ...x]);
      callback(result);
    }
  }

  const musicgen = resetInterrupt(musicgenWithProgress);
  const handleChange = parseFormChange(setMusicgenParams);

  const useAsMelody = (melody?: string, metadata?: MusicgenResult) => {
    if (!melody) return;
    setMusicgenParams({
      ...musicgenParams,
      melody,
    });
  };

  const useSeed = (_url: string, data?: MusicgenResult) => {
    const seed = data?.json.seed;
    if (!seed) return;
    setMusicgenParams({
      ...musicgenParams,
      seed: Number(seed),
    });
  };

  const useParameters = (_url: string, data?: MusicgenResult) => {
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
    favorite: barkFavorite,
    useSeed,
    useParameters,
  };

  const clearHistory = () => setHistoryData([]);
  return (
    <Template>
      <Head>
        <title>Musicgen - TTS Generation Webui</title>
      </Head>
      <div className="p-4 flex flex-col gap-y-4">
        <MusicgenInputs
          musicgenParams={musicgenParams}
          handleChange={handleChange}
          setMusicgenParams={setMusicgenParams}
          musicgenResult={musicgenResult}
        />

        <HyperParameters
          params={musicgenHyperParams}
          setParams={setMusicgenHyperParams}
          progress={progress.current}
          progressMax={progress.max}
          isInterrupted={interrupted.current}
          interrupt={interrupt}
        />

        <div className="flex flex-col gap-y-2">
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={musicgen}
          >
            Generate
          </button>
          <AudioOutput
            audioOutput={musicgenResult?.audio}
            label="Musicgen Output"
            funcs={funcs}
            metadata={musicgenResult}
            filter={["sendToMusicgen"]}
          />
        </div>

        <MusicgenHistory
          clearHistory={clearHistory}
          showLast={showLast}
          setShowLast={setShowLast}
          historyData={historyData}
          funcs={funcs}
        />
      </div>
    </Template>
  );
};

export default MusicgenPage;

const MusicgenHistory = ({
  clearHistory,
  showLast,
  setShowLast,
  historyData,
  funcs,
}: {
  clearHistory: () => void;
  showLast: number;
  setShowLast: React.Dispatch<React.SetStateAction<number>>;
  historyData: MusicgenResult[];
  funcs: {
    useAsMelody: (melody?: string, metadata?: MusicgenResult) => void;
    favorite: (
      _url: string,
      data?: { history_bundle_name_data?: string | undefined } | undefined
    ) => Promise<any>;
    useSeed: (_url: string, data?: MusicgenResult) => void;
    useParameters: (_url: string, data?: MusicgenResult) => void;
  };
}) => (
  <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded">
    <label className="text-sm">History:</label>
    <div className="flex gap-x-2 items-center">
      <button
        className="border border-gray-300 p-2 px-40 rounded"
        onClick={clearHistory}
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
);
