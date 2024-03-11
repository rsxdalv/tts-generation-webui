import React from "react";
import { Template } from "../../components/Template";
import useLocalStorage from "../../hooks/useLocalStorage";
import { AudioOutput } from "../../components/AudioComponents";
import Head from "next/head";
import {
  EncodecParamsNPZ,
  vocosIdNPZ,
  initialState,
} from "../../tabs/VocosParamsNPZ";
import { GradioFile } from "../../types/GradioFile";
import FileInput from "../../components/FileInput";
import { encodecDecode } from "../../functions/encodecDecode";

const VocosPageNPZ = () => {
  const [data, setData] = useLocalStorage<GradioFile | null>(
    "vocosOutputNpz",
    null
  );
  const [dataEncodec, setDataEncodec] = useLocalStorage<GradioFile | null>(
    "vocosOutputNpzEncodec",
    null
  );
  const [vocosParams, setVocosParams] = useLocalStorage<EncodecParamsNPZ>(
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

  async function decodeWithEncodec() {
    const result = await encodecDecode(vocosParams);
    setDataEncodec(result);
  }

  return (
    <Template>
      <Head>
        <title>Vocos - TTS Generation Webui</title>
      </Head>
      <div className="flex space-x-4 p-4">
        <div className="flex flex-col space-y-2">
          <FileInput
            accept=".npz"
            callback={(npz_file) => {
              setVocosParams({
                ...vocosParams,
                npz_file,
              });
            }}
            hide_text={false}
          />

          <button
            className="border border-gray-300 p-2 rounded"
            onClick={vocos}
          >
            Restore with Vocos
          </button>
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={decodeWithEncodec}
          >
            Decode with Encodec
          </button>
        </div>
        <div className="flex flex-col space-y-4">
          {data && <AudioOutput audioOutput={data} label="Vocos Output" />}
          {dataEncodec && (
            <AudioOutput audioOutput={dataEncodec} label="Encodec Output" />
          )}
        </div>
      </div>
    </Template>
  );
};

export default VocosPageNPZ;
