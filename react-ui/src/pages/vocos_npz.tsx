import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import { VocosParamsNPZ, vocosIdNPZ, initialState } from "../tabs/VocosParamsNPZ";
import { GradioFile } from "../types/GradioFile";
import FileInput from "../components/FileInput";

const VocosPageNPZ = () => {
  const [data, setData] = useLocalStorage<GradioFile[] | null>(
    "vocosOutputNpz",
    null
  );
  const [vocosParams, setVocosParams] = useLocalStorage<VocosParamsNPZ>(
    vocosIdNPZ,
    initialState
  );

  async function vocos() {
    const response = await fetch("/api/gradio/vocos_npz", {
      method: "POST",
      body: JSON.stringify(vocosParams),
    });

    const result = await response.json();
    setData(result);
  }

  const useAsInput = (audio?: string) => {
    if (!audio) return;
    setVocosParams({
      ...vocosParams,
      npz_file: audio,
    });
  };

  return (
    <Template>
      <Head>
        <title>Vocos - TTS Generation Webui</title>
      </Head>
      <div className="flex space-x-4">
        <div className="flex flex-col space-y-2">
          <FileInput
            accept=".npz"
            callback={(file) => {
              setVocosParams({
                ...vocosParams,
                npz_file: file?.name,
              });
            }}
          />

          <button
            className="border border-gray-300 p-2 rounded"
            onClick={vocos}
          >
            Restore with Vocos
          </button>
        </div>
        <div className="flex flex-col space-y-4">
          <AudioOutput
            audioOutput={data}
            label="Vocos Output"
            funcs={[useAsInput]}
            filter={["sendToVocos"]}
          />
        </div>
      </div>
    </Template>
  );
};

export default VocosPageNPZ;
