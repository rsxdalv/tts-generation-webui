import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import {
  useTortoiseGenerationParams,
  useTortoiseResult,
} from "../tabs/TortoiseGenerationParams";
import { TortoiseInput } from "../components/TortoiseInput";
import { TortoiseResult } from "../tabs/TortoiseResult";
import { generateWithTortoise } from "../functions/generateWithTortoise";
import { barkFavorite } from "../functions/barkFavorite";
import { parseFormChange } from "../data/parseFormChange";
import {
  GenerationHistory,
  GenerationHistorySimple,
} from "../components/GenerationHistory";

const initialHistory = []; // prevent infinite loop
const TortoiseGenerationPage = () => {
  const [historyData, setHistoryData] = useLocalStorage<TortoiseResult[]>(
    "tortoiseGenerationHistory",
    initialHistory
  );
  const [tortoiseResult, setTortoiseResult] = useTortoiseResult();
  const [tortoiseGenerationParams, setTortoiseGenerationParams] =
    useTortoiseGenerationParams();
  // loading state
  const [loading, setLoading] = React.useState<boolean>(false);

  async function tortoiseGeneration() {
    setLoading(true);
    const result = await generateWithTortoise(tortoiseGenerationParams);
    setTortoiseResult(result);
    setHistoryData((historyData) => [result, ...historyData]);
    setLoading(false);
  }

  const useSeed = (_url: string, data?: TortoiseResult) => {
    const seed = data?.seed;
    if (!seed) return;
    setTortoiseGenerationParams({
      ...tortoiseGenerationParams,
      seed: Number(seed),
    });
  };

  const favorite = async (_url: string, data?: TortoiseResult) => {
    const history_bundle_name_data = data?.bundle_name;
    barkFavorite("", { history_bundle_name_data });
  };

  // const useParameters = (_url: string, data?: Result) => {
  //   const {
  //     prompt,
  //     speaker,
  //     preset,
  //     cvvp_amount,
  //     split_prompt,
  //     samples,
  //     diffusion_iterations,
  //     temperature,
  //     length_penalty,
  //     repetition_penalty,
  //     top_p,
  //     max_mel_tokens,
  //     cond_free,
  //     cond_free_k,
  //     diffusion_temperature,
  //     model,
  //     generation_name,
  //   } = data?.metadata ?? {};
  //   if (!prompt) return;
  //   setTortoiseGenerationParams({
  //     ...tortoiseGenerationParams,
  //     prompt,
  //     speaker,
  //     preset,
  //     cvvp_amount,
  //     split_prompt,
  //     samples,
  //     diffusion_iterations,
  //     temperature,
  //     length_penalty,
  //     repetition_penalty,
  //     top_p,
  //     max_mel_tokens,
  //     cond_free,
  //     cond_free_k,
  //     diffusion_temperature,
  //     model,
  //     generation_name,
  //   });
  // }

  const funcs = { useSeed, favorite };

  const handleChange = parseFormChange(setTortoiseGenerationParams);

  return (
    <Template>
      <Head>
        <title>Tortoise - TTS Generation Webui</title>
      </Head>
      <div className="flex w-full flex-col">
        <TortoiseInput
          tortoiseGenerationParams={tortoiseGenerationParams}
          setTortoiseGenerationParams={setTortoiseGenerationParams}
          handleChange={handleChange}
          data={tortoiseResult}
        />
        <div className="flex flex-col space-y-4">
          <button
            className="border border-gray-300 p-2 rounded hover:bg-gray-100"
            onClick={tortoiseGeneration}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
          <AudioOutput
            audioOutput={tortoiseResult?.audio}
            label="Tortoise Output"
            funcs={funcs}
            metadata={tortoiseResult}
            filter={["sendToTortoise", "sendToTortoiseVoiceGeneration"]}
          />
        </div>

        <GenerationHistorySimple
          name="tortoise"
          setHistoryData={setHistoryData}
          historyData={historyData}
          funcs={funcs}
          nameKey="bundle_name"
          filter={["sendToTortoise", "sendToTortoiseVoiceGeneration"]}
        />
      </div>
      {/* <pre>{JSON.stringify(tortoiseGenerationParams, null, 2)}</pre> */}
    </Template>
  );
};

export default TortoiseGenerationPage;
