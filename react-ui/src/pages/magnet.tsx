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

  const consumer = async (params: MagnetParams) => {
    const data = await generateWithMagnet(params);
    setData(data);
    setHistoryData((x) => [data, ...x]);
    return data;
  };

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
          handleChange={parseFormChange(setMagnetParams)}
          setMagnetParams={setMagnetParams}
          data={data}
        />

        <HyperParameters
          genParams={magnetParams}
          consumer={consumer}
          prefix="magnet"
        />

        <div className="flex flex-col gap-y-2">
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
