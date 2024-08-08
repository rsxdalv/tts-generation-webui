import React from "react";
import { Template } from "../components/Template";
import Head from "next/head";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioOutput } from "../components/AudioComponents";
import {
  VallexParams,
  VallexResult,
  useVallexParams,
  useVallexResult,
} from "../tabs/VallexParams";
import { HyperParameters } from "../components/HyperParameters";
import { parseFormChange } from "../data/parseFormChange";
import { VallexInputs } from "../components/VallexInputs";
import { generateWithVallex } from "../functions/generateWithVallex";
import { GenerationHistorySimple } from "../components/GenerationHistory";

const initialHistory = []; // prevent infinite loop
const VallexPage = () => {
  const [data, setData] = useVallexResult();
  const [historyData, setHistoryData] = useLocalStorage<VallexResult[]>(
    "vallexHistory",
    initialHistory
  );
  const [vallexParams, setVallexParams] = useVallexParams();

  async function vallexConsumer(params: VallexParams) {
    const data = await generateWithVallex(params);
    setData(data);
    setHistoryData((x) => [data, ...x]);
    return data;
  }

  const handleChange = parseFormChange(setVallexParams);

  //   const useSeed = (_url: string, data?: VallexResult) => {
  //     const seed = data?.metadata?.seed;
  //     if (!seed) return;
  //     setVallexParams({
  //       ...vallexParams,
  //       //   seed: Number(seed),
  //     });
  //   };

  const useParameters = (_url: string, data?: VallexResult) => {
    const params = data?.metadata;
    if (!params) return;
    setVallexParams({
      ...vallexParams,
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
        <title>Vallex - TTS Generation Webui</title>
      </Head>
      <div className="gap-y-4 p-4 flex w-full flex-col">
        <div>
          <details>
            <summary>Description</summary>
            VALL-E X is an amazing multilingual text-to-speech (TTS) model
            proposed by Microsoft. While Microsoft initially publish in their
            research paper, they did not release any code or pretrained models.
            Recognizing the potential and value of this technology, our team
            took on the challenge to reproduce the results and train our own
            model. We are glad to share our trained VALL-E X model with the
            community, allowing everyone to experience the power next-generation
            TTS! 🎧
          </details>
        </div>
        <VallexInputs
          vallexParams={vallexParams}
          handleChange={handleChange}
          setVallexParams={setVallexParams}
          data={data}
        />

        <div className="flex flex-row gap-2">
          <AudioOutput
            audioOutput={data?.audio}
            label="Vallex Output"
            funcs={funcs}
            metadata={data}
            filter={["sendToVallex"]}
          />
          <div className="flex flex-col gap-2">
            <HyperParameters
              genParams={vallexParams}
              consumer={vallexConsumer}
              prefix="vallex"
            />
          </div>
        </div>

        <GenerationHistorySimple
          name="vallex"
          setHistoryData={setHistoryData}
          historyData={historyData}
          funcs={funcs}
          nameKey={undefined}
          filter={["sendToVallex"]}
        />
      </div>
    </Template>
  );
};

export default VallexPage;
