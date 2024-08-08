import React from "react";
import { Template } from "../components/Template";
import Head from "next/head";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioOutput } from "../components/AudioComponents";
import {
  MahaParams,
  MahaResult,
  useMahaParams,
  useMahaResult,
} from "../tabs/MahaParams";
import { HyperParameters } from "../components/HyperParameters";
import { parseFormChange } from "../data/parseFormChange";
import { barkFavorite } from "../functions/barkFavorite";
import { MahaInputs } from "../components/MahaInputs";
import { generateWithMaha } from "../functions/generateWithMaha";
import { GenerationHistorySimple } from "../components/GenerationHistory";

const initialHistory = []; // prevent infinite loop
const MahaPage = () => {
  const [data, setData] = useMahaResult();
  const [historyData, setHistoryData] = useLocalStorage<MahaResult[]>(
    "mahaHistory",
    initialHistory
  );
  const [mahaParams, setMahaParams] = useMahaParams();

  async function mahaConsumer(params: MahaParams) {
    const data = await generateWithMaha(params);
    setData(data);
    setHistoryData((x) => [data, ...x]);
    return data;
  }

  const handleChange = parseFormChange(setMahaParams);

  const useSeed = (_url: string, data?: MahaResult) => {
    const seed = data?.metadata?.seed;
    if (!seed) return;
    setMahaParams({
      ...mahaParams,
      seed: Number(seed),
    });
  };

  const useParameters = (_url: string, data?: MahaResult) => {
    const params = data?.metadata;
    if (!params) return;
    setMahaParams({
      ...mahaParams,
      ...params,
      seed: Number(params.seed),
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
        <title>Maha - TTS Generation Webui</title>
      </Head>
      <div className="gap-y-4 p-4 flex w-full flex-col">
        <MahaInputs
          mahaParams={mahaParams}
          handleChange={handleChange}
          setMahaParams={setMahaParams}
          data={data}
        />

        <div className="flex flex-row gap-2">
          <AudioOutput
            audioOutput={data?.audio}
            label="Maha Output"
            funcs={funcs}
            metadata={data}
            filter={["sendToMaha"]}
          />
          <div className="flex flex-col gap-2">
            <HyperParameters
              genParams={mahaParams}
              consumer={mahaConsumer}
              prefix="maha"
            />
          </div>
        </div>

        <GenerationHistorySimple
          name="maha"
          setHistoryData={setHistoryData}
          historyData={historyData}
          funcs={funcs}
          nameKey={undefined}
          filter={["sendToMaha"]}
        />
      </div>
    </Template>
  );
};

export default MahaPage;
