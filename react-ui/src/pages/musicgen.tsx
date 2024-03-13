import React from "react";
import { Template } from "../components/Template";
import Head from "next/head";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioOutput } from "../components/AudioComponents";
import {
  MusicgenParams,
  MusicgenResult,
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
import { parseFormChange } from "../data/parseFormChange";
import { barkFavorite } from "../functions/barkFavorite";
import { generateWithMusicgen } from "../functions/generateWithMusicgen";
import { MusicgenInputs } from "../components/MusicgenInputs";

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
