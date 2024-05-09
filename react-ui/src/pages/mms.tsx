import React from "react";
import { Template } from "../components/Template";
import Head from "next/head";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioOutput } from "../components/AudioComponents";
import {
  MMSParams,
  MMSResult,
  useMMSParams,
  useMMSResult,
} from "../tabs/MMSParams";
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
import { MMSInputs } from "../components/MMSInputs";
import { generateWithMMS } from "../functions/generateWithMMS";
import { GenerationHistory } from "../components/GenerationHistory";

const initialHistory = []; // prevent infinite loop
const MMSPage = () => {
  const [data, setData] = useMMSResult();
  const [historyData, setHistoryData] = useLocalStorage<MMSResult[]>(
    "mmsHistory",
    initialHistory
  );
  const [mmsParams, setMMSParams] = useMMSParams();
  const [hyperParams, setHyperParams] = useLocalStorage<
    typeof initialHyperParams
  >("mmsHyperParams", initialHyperParams);
  const [showLast, setShowLast] = useLocalStorage<number>("mmsShowLast", 10);

  const { interrupted, resetInterrupt, interrupt } = useInterrupt();
  const [progress, setProgress] = React.useState({ current: 0, max: 0 });

  function mmsWithProgress() {
    const texts = extractTexts(mmsParams.text, hyperParams);
    const { iterations } = hyperParams;

    return manageProgress(
      ({ incrementProgress }) =>
        mmsConsumer(
          mmsGenerator(texts, iterations, mmsParams),
          incrementProgress
        ),
      getMax(texts, iterations),
      setProgress
    );
  }

  async function* mmsGenerator(
    texts: string[],
    iterations: number,
    mmsParams: MMSParams
  ) {
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (const text of texts) {
        if (interrupted.current) {
          return;
        }
        yield generateWithMMS({
          ...mmsParams,
          text,
          //   seed: incrementNonRandomSeed(mmsParams.seed, iteration),
        });
      }
    }
  }

  async function mmsConsumer(
    generator: AsyncGenerator<MMSResult, void, unknown>,
    callback: (result: MMSResult) => void
  ) {
    for await (const result of generator) {
      setData(result);
      setHistoryData((x) => [result, ...x]);
      callback(result);
    }
  }

  const mms = resetInterrupt(mmsWithProgress);
  const handleChange = parseFormChange(setMMSParams);

  //   const useSeed = (_url: string, data?: MMSResult) => {
  //     const seed = data?.metadata?.seed;
  //     if (!seed) return;
  //     setMMSParams({
  //       ...mmsParams,
  //       //   seed: Number(seed),
  //     });
  //   };

  const useParameters = (_url: string, data?: MMSResult) => {
    const params = data?.metadata;
    if (!params) return;
    setMMSParams({
      ...mmsParams,
      ...params,
      //   seed: Number(params.seed),
    });
  };

  const funcs = {
    favorite: barkFavorite,
    // useSeed,
    useParameters,
  };
  const clearHistory = () => setHistoryData([]);
  return (
    <Template>
      <Head>
        <title>MMS - TTS Generation Webui</title>
      </Head>
      <div className="gap-y-4 p-4 flex w-full flex-col">
        <div>
          <details>
            <summary>Description</summary>
            <p>
              The MMS-TTS checkpoints are trained on lower-cased, un-punctuated
              text. By default, the VitsTokenizer normalizes the inputs by
              removing any casing and punctuation, to avoid passing
              out-of-vocabulary characters to the model. Hence, the model is
              agnostic to casing and punctuation, so these should be avoided in
              the text prompt.
            </p>
            <p>
              For certain languages with non-Roman alphabets, such as Arabic,
              Mandarin or Hindi, the uroman perl package is required to
              pre-process the text inputs to the Roman alphabet.
            </p>
            <p>Parameters:</p>
            <ul className="list-disc list-inside">
              <li>
                Speaking rate: Larger values give faster synthesised speech.
              </li>
              <li>
                Noise Scale: How random the speech prediction is. Larger values
                create more variation in the predicted speech.
              </li>
              <li>
                Noise Scale Duration: How random the duration prediction is.
                Larger values create more variation in the predicted durations.
              </li>
            </ul>
          </details>
        </div>
        <MMSInputs
          mmsParams={mmsParams}
          handleChange={handleChange}
          setMmsParams={setMMSParams}
          data={data}
        />

        <div className="flex flex-row gap-2">
          <AudioOutput
            audioOutput={data?.audio}
            label="MMS Output"
            funcs={funcs}
            metadata={data}
            filter={["sendToMMS"]}
          />
          <div className="flex flex-col gap-2">
            <HyperParameters
              params={hyperParams}
              setParams={setHyperParams}
              interrupt={interrupt}
              isInterrupted={interrupted.current}
              progress={progress.current}
              progressMax={progress.max}
            />
            <button
              className="border border-gray-300 p-2 rounded"
              onClick={mms}
            >
              Generate
            </button>
          </div>
        </div>

        <GenerationHistory
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

export default MMSPage;
