import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import { VocosParams, vocosId, initialState } from "../tabs/VocosParams";
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

const VocosPage = () => {
  const [data, setData] = useLocalStorage<TypedGradioFile[] | null>(
    "vocosOutput",
    null
  );
  const [vocosParams, setVocosParams] = useLocalStorage<VocosParams>(
    vocosId,
    initialState
  );

  async function vocos() {
    const response = await fetch("/api/gradio/vocos", {
      method: "POST",
      body: JSON.stringify(vocosParams),
    });

    const result = await response.json();
    setData(result);
  }

  const sampleWithTypeNames =
    data && addTypeNamesToAudioOutputs(data, typeNames);

  const useAsInput = (audio?: string) => {
    if (!audio) return;
    setVocosParams({
      ...vocosParams,
      audio,
    });
  };

  return (
    <Template>
      <Head>
        <title>Vocos - TTS Generation Webui</title>
      </Head>
      <div className="flex space-x-4">
        <div className="flex flex-col space-y-2">
          <AudioInput
            url={vocosParams?.audio}
            callback={(file) => {
              setVocosParams({
                ...vocosParams,
                audio: file,
              });
            }}
            filter={["sendToVocos"]}
          />

          <button
            className="border border-gray-300 p-2 rounded"
            onClick={vocos}
          >
            Restore with Vocos
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
                filter={["sendToVocos"]}
              />
            );
          })}
        </div>
      </div>
    </Template>
  );
};

export default VocosPage;
