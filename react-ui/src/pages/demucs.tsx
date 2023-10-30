import React, { useState } from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { GradioFile } from "./api/demucs_musicgen";
import { useRouter } from "next/router";
import { AudioInput, AudioOutput } from "../components/AudioComponents";

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

type DemucsParams = {
  file?: string;
};

const initialState: DemucsParams = {
  file: "https://www.mfiles.co.uk/mp3-downloads/gs-cd-track2.mp3",
};

const DemucsPage = () => {
  const [data, setData] = useLocalStorage<TypedGradioFile[] | null>(
    "data",
    null
  );
  const [demucsParams, setDemucsParams] = useLocalStorage<DemucsParams>(
    "demucs-tab",
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

  const router = useRouter();

  const sendToDemucs = (file: string) => {
    setDemucsParams(
      (demucsParams) => ({ ...demucsParams, file } as DemucsParams)
    );
    router.push("/demucs");
  };

  const sendAudioTo = (audio: string | undefined) => {
    if (audio) sendToDemucs(audio);
  };

  return (
    <Template>
      <div className="p-4">
        <div>
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
          {typeNames.map((typeName, index) => {
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
