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
import { parseFormChange } from "../data/parseFormChange";
import { barkFavorite } from "../functions/barkFavorite";
import { generateWithMusicgen } from "../functions/generateWithMusicgen";
import { MusicgenInputs } from "../components/MusicgenInputs";
import { GenerationHistorySimple } from "../components/GenerationHistory";

const initialHistory = []; // prevent infinite loop
const MusicgenPage = () => {
  const [musicgenResult, setMusicgenResult] = useMusicgenResult();
  const [historyData, setHistoryData] = useLocalStorage<MusicgenResult[]>(
    "musicgenHistory",
    initialHistory
  );
  const [musicgenParams, setMusicgenParams] = useMusicgenParams();

  async function musicgenConsumer(params: MusicgenParams) {
    const data = await generateWithMusicgen(params);
    setMusicgenResult(data);
    setHistoryData((x) => [data, ...x]);
    return data;
  }

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
          genParams={musicgenParams}
          consumer={musicgenConsumer}
          prefix="musicgen"
        />

        <div className="flex flex-col gap-y-2">
          <AudioOutput
            audioOutput={musicgenResult?.audio}
            label="Musicgen Output"
            funcs={funcs}
            metadata={musicgenResult}
            filter={["sendToMusicgen"]}
          />
        </div>

        <GenerationHistorySimple
          name="musicgen"
          setHistoryData={setHistoryData}
          historyData={historyData}
          funcs={funcs}
          nameKey="history_bundle_name_data"
          filter={["sendToMusicgen"]}
        />
      </div>
    </Template>
  );
};

export default MusicgenPage;
