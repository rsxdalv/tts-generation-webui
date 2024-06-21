import React from "react";
import { Template } from "../components/Template";
import Head from "next/head";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioOutput } from "../components/AudioComponents";
import {
  MagnetParams,
  MagnetResult,
  initialMagnetParams,
  useMagnetParams,
  useMagnetResult,
} from "../tabs/MagnetParams";
import { HyperParameters } from "../components/HyperParameters";
import {
  extractTexts,
  getMax,
  incrementNonRandomSeed,
  initialHyperParams,
} from "../data/hyperParamsUtils";
import { useInterrupt } from "../hooks/useInterrupt";
import { manageProgress } from "../components/Progress";
import { parseFormChange } from "../data/parseFormChange";
import { barkFavorite } from "../functions/barkFavorite";
import { MagnetInputs } from "../components/MagnetInputs";
import { generateWithMagnet } from "../functions/generateWithMagnet";
import { GenerationHistorySimple } from "../components/GenerationHistory";

const initialHistory = []; // prevent infinite loop
const MagnetPage = () => {
  const [data, setData] = useMagnetResult();
  const [historyData, setHistoryData] = useLocalStorage<MagnetResult[]>(
    "magnetHistory",
    initialHistory
  );
  const [magnetParams, setMagnetParams] = useMagnetParams();
  const [hyperParams, setHyperParams] = useLocalStorage<
    typeof initialHyperParams
  >("magnetHyperParams", initialHyperParams);

  const { interrupted, resetInterrupt, interrupt } = useInterrupt();
  const [progress, setProgress] = React.useState({ current: 0, max: 0 });

  function magnetWithProgress() {
    const texts = extractTexts(magnetParams.text, hyperParams);
    const { iterations } = hyperParams;

    return manageProgress(
      ({ incrementProgress }) =>
        magnetConsumer(
          magnetGenerator(texts, iterations, magnetParams),
          incrementProgress
        ),
      getMax(texts, iterations),
      setProgress
    );
  }

  async function* magnetGenerator(
    texts: string[],
    iterations: number,
    magnetParams: MagnetParams
  ) {
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (const text of texts) {
        if (interrupted.current) {
          return;
        }
        yield generateWithMagnet({
          ...magnetParams,
          text,
          seed: incrementNonRandomSeed(magnetParams.seed, iteration),
        });
      }
    }
  }

  async function magnetConsumer(
    generator: AsyncGenerator<MagnetResult, void, unknown>,
    callback: (result: MagnetResult) => void
  ) {
    for await (const result of generator) {
      setData(result);
      setHistoryData((x) => [result, ...x]);
      callback(result);
    }
  }

  const magnet = resetInterrupt(magnetWithProgress);
  const handleChange = parseFormChange(setMagnetParams);

  const useSeed = (_url: string, data?: MagnetResult) => {
    const seed = data?.json.seed;
    if (!seed) return;
    setMagnetParams({
      ...magnetParams,
      seed: Number(seed),
    });
  };

  const useParameters = (_url: string, data?: MagnetResult) => {
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
    favorite: barkFavorite,
    useSeed,
    useParameters,
  };
  return (
    <Template>
      <Head>
        <title>Magnet - TTS Generation Webui</title>
      </Head>
      <div className="gap-y-4 p-4 flex w-full flex-col">
        <MagnetInputs
          magnetParams={magnetParams}
          handleChange={handleChange}
          setMagnetParams={setMagnetParams}
          data={data}
        />

        <HyperParameters
          params={hyperParams}
          setParams={setHyperParams}
          interrupt={interrupt}
          isInterrupted={interrupted.current}
          progress={progress.current}
          progressMax={progress.max}
        />

        <div className="flex flex-col gap-y-2">
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

        <GenerationHistorySimple
          name="magnet"
          setHistoryData={setHistoryData}
          historyData={historyData}
          funcs={funcs}
          nameKey="history_bundle_name_data"
          filter={["sendToMagnet"]}
        />
      </div>
    </Template>
  );
};

export default MagnetPage;
