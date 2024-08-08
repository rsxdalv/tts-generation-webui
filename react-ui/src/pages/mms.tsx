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
import { parseFormChange } from "../data/parseFormChange";
import { MMSInputs } from "../components/MMSInputs";
import { generateWithMMS } from "../functions/generateWithMMS";
import { GenerationHistorySimple } from "../components/GenerationHistory";

const DETAILS = (
  <details>
    <summary>Description</summary>
    <p>
      The MMS-TTS checkpoints are trained on lower-cased, un-punctuated text. By
      default, the VitsTokenizer normalizes the inputs by removing any casing
      and punctuation, to avoid passing out-of-vocabulary characters to the
      model. Hence, the model is agnostic to casing and punctuation, so these
      should be avoided in the text prompt.
    </p>
    <p>
      For certain languages with non-Roman alphabets, such as Arabic, Mandarin
      or Hindi, the uroman perl package is required to pre-process the text
      inputs to the Roman alphabet.
    </p>
    <p>Parameters:</p>
    <ul className="list-disc list-inside">
      <li>Speaking rate: Larger values give faster synthesised speech.</li>
      <li>
        Noise Scale: How random the speech prediction is. Larger values create
        more variation in the predicted speech.
      </li>
      <li>
        Noise Scale Duration: How random the duration prediction is. Larger
        values create more variation in the predicted durations.
      </li>
    </ul>
  </details>
);

const initialHistory = []; // prevent infinite loop
const MMSPage = () => {
  const [data, setData] = useMMSResult();
  const [historyData, setHistoryData] = useLocalStorage<MMSResult[]>(
    "mmsHistory",
    initialHistory
  );
  const [mmsParams, setMMSParams] = useMMSParams();

  async function mmsConsumer(params: MMSParams) {
    const data = await generateWithMMS(params);
    setData(data);
    setHistoryData((x) => [data, ...x]);
    return data;
  }

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
    // favorite: barkFavorite,
    // useSeed,
    useParameters,
  };

  return (
    <Template>
      <Head>
        <title>MMS - TTS Generation Webui</title>
      </Head>
      <div className="gap-y-4 p-4 flex w-full flex-col">
        {DETAILS}
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
              genParams={mmsParams}
              consumer={mmsConsumer}
              prefix="mms"
            />
          </div>
        </div>

        <GenerationHistorySimple
          name="mms"
          setHistoryData={setHistoryData}
          historyData={historyData}
          funcs={funcs}
          nameKey={undefined}
          filter={["sendToMMS"]}
        />
      </div>
    </Template>
  );
};

export default MMSPage;
