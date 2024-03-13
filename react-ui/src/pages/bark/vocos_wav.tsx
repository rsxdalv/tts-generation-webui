import React from "react";
import { Template } from "../../components/Template";
import { AudioInput, AudioOutput } from "../../components/AudioComponents";
import Head from "next/head";
import { useVocosResults, useVocosParams } from "../../tabs/VocosParams";
import { parseFormChange } from "../../data/parseFormChange";
import { applyVocosWav } from "../../functions/applyVocosWav";
import { VocosWavInputs } from "../../components/VocosWavInputs";

const VocosPage = () => {
  const [vocosResult, setVocosResult] = useVocosResults();
  const [vocosParams, setVocosParams] = useVocosParams();

  async function vocos() {
    const result = await applyVocosWav(vocosParams);
    setVocosResult(result);
  }

  const useAsInput = (audio?: string) => {
    if (!audio) return;
    setVocosParams({
      ...vocosParams,
      audio,
    });
  };

  const handleChange = parseFormChange(setVocosParams);

  return (
    <Template>
      <Head>
        <title>Vocos - TTS Generation Webui</title>
      </Head>
      <div className="flex space-x-4 p-4">
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

          <VocosWavInputs
            vocosParams={vocosParams}
            handleChange={handleChange}
          />

          <button
            className="border border-gray-300 p-2 rounded"
            onClick={vocos}
          >
            Restore with Vocos
          </button>
        </div>
        <div className="flex flex-col space-y-4">
          {vocosResult && (
            <AudioOutput
              audioOutput={vocosResult}
              label="Vocos Output"
              funcs={{ useAsInput }}
              filter={["sendToVocos"]}
            />
          )}
        </div>
      </div>
    </Template>
  );
};

export default VocosPage;
