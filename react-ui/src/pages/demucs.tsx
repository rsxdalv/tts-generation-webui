import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import { DemucsParams, demucsId, initialState } from "../tabs/DemucsParams";
import { GradioFile } from "../types/GradioFile";
import { splitWithDemucs } from "../functions/splitWithDemucs";
import { GenerationHistorySimple } from "../components/GenerationHistory";

type TypedGradioFile = GradioFile & {
  type_name?: string;
};

const typeNames = ["drums", "bass", "other", "vocals"];

const addTypeNamesToAudioOutputs = (
  audioOutputs: TypedGradioFile[],
  typeNames: string[]
) =>
  audioOutputs.map((audioOutput, index) => ({
    ...audioOutput,
    type_name: typeNames[index],
  }));

const initialHistory = []; // prevent infinite loop
const DemucsPage = () => {
  const [data, setData] = useLocalStorage<
    { audio: TypedGradioFile; typeName: string }[] | null
  >("demucsOutput", null);

  const [historyData, setHistoryData] = useLocalStorage<
    {
      audio: TypedGradioFile;
      typeName: string;
    }[]
  >("demucsHistory", initialHistory);

  const [demucsParams, setDemucsParams] = useLocalStorage<DemucsParams>(
    demucsId,
    initialState
  );

  async function demucs() {
    const result = await splitWithDemucs(demucsParams);
    const sampleWithTypeNames = addTypeNamesToAudioOutputs(result, typeNames);
    const data = typeNames.map((typeName) => ({
      audio: sampleWithTypeNames?.find((item) => item.type_name === typeName)!,
      typeName,
    }));
    setData(data);
    setHistoryData((historyData) => [...data, ...historyData]);
  }

  const useAsInput = (audio?: string) => {
    if (!audio) return;
    setDemucsParams({ ...demucsParams, file: audio });
  };

  const funcs = { useAsInput };

  return (
    <Template>
      <Head>
        <title>Demucs - TTS Generation Webui</title>
      </Head>
      <div className="flex flex-col space-y-4">
        <div className="flex space-x-4">
          <div className="flex flex-col space-y-2">
            <AudioInput
              url={demucsParams?.file}
              callback={(file) => {
                if (!file) return;
                setDemucsParams({
                  ...demucsParams,
                  file,
                });
              }}
              filter={["sendToDemucs"]}
            />

            <button
              className="border border-gray-300 p-2 rounded"
              onClick={demucs}
            >
              Split with Demucs
            </button>
          </div>
          <div className="flex flex-col space-y-4">
            {data &&
              data.map(({ audio, typeName }) => (
                <AudioOutput
                  key={typeName}
                  audioOutput={audio}
                  label={typeName}
                  funcs={funcs}
                  filter={["sendToDemucs"]}
                />
              ))}
          </div>
        </div>

        <GenerationHistorySimple
          name="demucs"
          setHistoryData={setHistoryData}
          historyData={historyData.slice(3)}
          funcs={funcs}
          nameKey="typeName"
          filter={["sendToDemucs"]}
        />
      </div>
    </Template>
  );
};

export default DemucsPage;
