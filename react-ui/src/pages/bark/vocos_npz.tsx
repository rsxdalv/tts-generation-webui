import React from "react";
import { Template } from "../../components/Template";
import useLocalStorage from "../../hooks/useLocalStorage";
import { AudioOutput } from "../../components/AudioComponents";
import Head from "next/head";
import {
  useVocosParamsNPZ,
  useVocosResultsNPZ,
} from "../../tabs/VocosParamsNPZ";
import { GradioFile } from "../../types/GradioFile";
import FileInput from "../../components/FileInput";
import { encodecDecode } from "../../functions/encodecDecode";
import { applyVocosNPZ } from "../../functions/applyVocosNPZ";

const VocosPageNPZ = () => {
  const [dataEncodec, setDataEncodec] = useLocalStorage<GradioFile | null>(
    "vocosOutputNpzEncodec",
    null
  );
  const [vocosResult, setVocosResult] = useVocosResultsNPZ();
  const [vocosParamsNPZ, setVocosParamsNPZ] = useVocosParamsNPZ();

  const vocos = async () => setVocosResult(await applyVocosNPZ(vocosParamsNPZ));
  const decodeWithEncodec = async () =>
    setDataEncodec(await encodecDecode(vocosParamsNPZ));

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
              setVocosParamsNPZ({
                ...vocosParamsNPZ,
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
          {vocosResult && (
            <AudioOutput audioOutput={vocosResult} label="Vocos Output" />
          )}
          {dataEncodec && (
            <AudioOutput audioOutput={dataEncodec} label="Encodec Output" />
          )}
        </div>
      </div>
    </Template>
  );
};

export default VocosPageNPZ;
