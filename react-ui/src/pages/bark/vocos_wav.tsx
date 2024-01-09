import React from "react";
import { Template } from "../../components/Template";
import useLocalStorage from "../../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../../components/AudioComponents";
import Head from "next/head";
import { VocosParams, vocosId, initialState } from "../../tabs/VocosParams";
import { GradioFile } from "../../types/GradioFile";

type TypedGradioFile = GradioFile & {
  type_name?: string;
};

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
    const response = await fetch("/api/gradio/vocos_wav", {
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
      audio,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVocosParams({
      ...vocosParams,
      bandwidth: e.target.value,
    });
  };

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

          <div className="space-y-2">
            <label className="text-sm">Bandwidth in kbps:</label>
            <div className="flex flex-row space-x-2">
              {["1.5", "3.0", "6.0", "12.0"].map((bandwidth) => (
                <div key={bandwidth} className="flex items-center">
                  <input
                    type="radio"
                    name="model"
                    id={bandwidth}
                    value={bandwidth}
                    checked={vocosParams.bandwidth === bandwidth}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 rounded"
                  />
                  <label className="ml-1" htmlFor={bandwidth}>
                    {bandwidth}
                  </label>
                </div>
              ))}
            </div>
          </div>

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

export default VocosPage;
