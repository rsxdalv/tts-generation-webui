import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import { DemucsParams, demucsId, initialState } from "../tabs/DemucsParams";
import { GradioFile } from "../types/GradioFile";

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

const DemucsPage = () => {
  const [data, setData] = useLocalStorage<TypedGradioFile[] | null>(
    "demucsOutput",
    null
  );
  const [demucsParams, setDemucsParams] = useLocalStorage<DemucsParams>(
    demucsId,
    initialState
  );

  async function demucs() {
    const response = await fetch("/api/gradio/demucs", {
      method: "POST",
      body: JSON.stringify(demucsParams),
    });

    const result = await response.json();
    setData(result);
  }

  const sampleWithTypeNames =
    data && addTypeNamesToAudioOutputs(data, typeNames);

  const useAsInput = (audio?: string) => {
    if (!audio) return;
    setDemucsParams({
      ...demucsParams,
      file: audio,
    });
  };

  return (
    <Template>
      <Head>
        <title>Demucs - TTS Generation Webui</title>
      </Head>
      <div className="flex space-x-4">
        <div className="flex flex-col space-y-2">
          <AudioInput
            url={demucsParams?.file}
            callback={(file) => {
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
          {typeNames.map((typeName) => {
            const audioOutput = sampleWithTypeNames?.find(
              (item) => item.type_name === typeName
            );
            return (
              <AudioOutput
                key={typeName}
                audioOutput={audioOutput}
                label={typeName[0].toUpperCase() + typeName.slice(1)}
                funcs={[useAsInput]}
                filter={["sendToDemucs"]}
              />
            );
          })}
        </div>
      </div>
    </Template>
  );
};

export default DemucsPage;
