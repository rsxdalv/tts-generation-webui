import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { GradioFile } from "./api/demucs_musicgen";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import {
  DemucsParams,
  demucsId,
  initialState,
  sendToDemucs,
} from "../tabs/DemucsParams";

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
    "data",
    null
  );
  const [demucsParams, setDemucsParams] = useLocalStorage<DemucsParams>(
    demucsId,
    initialState
  );

  async function demucs() {
    const response = await fetch("/api/demucs_musicgen", {
      method: "POST",
      body: JSON.stringify(demucsParams),
    });

    const result = await response.json();
    setData(result?.data);
  }

  const sampleWithTypeNames =
    data && addTypeNamesToAudioOutputs(data, typeNames);

  const sendAudioTo = (audio: string | undefined) => {
    if (audio) sendToDemucs(audio);
  };

  return (
    <Template>
      <Head>
        <title>Demucs - TTS Generation Webui</title>
      </Head>
      <div className="flex space-x-4">
        <div className="flex flex-col">
          <AudioInput
            url={demucsParams?.file}
            callback={(file) => {
              setDemucsParams({
                ...demucsParams,
                file,
              });
            }}
            sendAudioTo={sendAudioTo}
          />

          <button
            className="border border-gray-300 p-2 rounded"
            onClick={demucs}
          >
            Split with Demucs
          </button>
        </div>
        <div className="flex flex-col">
          {typeNames.map((typeName) => {
            const audioOutput = sampleWithTypeNames?.find(
              (item) => item.type_name === typeName
            );
            return (
              <AudioOutput
                key={typeName}
                audioOutput={audioOutput}
                label={typeName}
                sendAudioTo={sendAudioTo}
              />
            );
          })}
        </div>
      </div>
    </Template>
  );
};

export default DemucsPage;
