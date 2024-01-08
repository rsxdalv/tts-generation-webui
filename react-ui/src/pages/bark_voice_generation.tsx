import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import {
  BarkVoiceGenerationParams,
  barkVoiceGenerationId,
  initialState,
} from "../tabs/BarkVoiceGenerationParams";
import { GradioFile } from "../types/GradioFile";

type Result = {
  filename: string;
  preview: GradioFile;
};

const BarkVoiceGenerationPage = () => {
  const [data, setData] = useLocalStorage<Result | null>(
    "barkVoiceGenerationOutput",
    null
  );
  const [barkVoiceGenerationParams, setBarkVoiceGenerationParams] =
    useLocalStorage<BarkVoiceGenerationParams>(
      barkVoiceGenerationId,
      initialState
    );

  async function barkVoiceGeneration() {
    const response = await fetch("/api/gradio/bark_voice_generate", {
      method: "POST",
      body: JSON.stringify(barkVoiceGenerationParams),
    });

    const result = await response.json();
    setData(result);
  }

  async function barkVoiceTokenizerLoad(
    barkVoiceGenerationParams: BarkVoiceGenerationParams
  ) {
    const response = await fetch("/api/gradio/bark_voice_tokenizer_load", {
      method: "POST",
      body: JSON.stringify(barkVoiceGenerationParams),
    });

    const result = await response.json();
    // setData(result);
  }

  const useAsInput = (audio?: string) => {
    if (!audio) return;
    setBarkVoiceGenerationParams({
      ...barkVoiceGenerationParams,
      audio,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = {
      ...barkVoiceGenerationParams,
      [e.target.name]: e.target.value,
    };
    setBarkVoiceGenerationParams(newParams);
    barkVoiceTokenizerLoad(newParams);
  };

  return (
    <Template>
      <Head>
        <title>Bark Voice Generation - TTS Generation Webui</title>
      </Head>
      <div className="space-y-2">
        <label className="text-sm">Tokenizer:</label>
        <select
          name="tokenizer"
          id="tokenizer"
          className="border border-gray-300 p-2 rounded text-black"
          value={barkVoiceGenerationParams?.tokenizer}
          onChange={handleChange}
        >
          {[
            "quantifier_hubert_base_ls960.pth @ GitMylo/bark-voice-cloning",
            "quantifier_hubert_base_ls960_14.pth @ GitMylo/bark-voice-cloning",
            "quantifier_V1_hubert_base_ls960_23.pth @ GitMylo/bark-voice-cloning",
            "polish-HuBERT-quantizer_8_epoch.pth @ Hobis/bark-voice-cloning-polish-HuBERT-quantizer",
            "german-HuBERT-quantizer_14_epoch.pth @ CountFloyd/bark-voice-cloning-german-HuBERT-quantizer",
            "es_tokenizer.pth @ Lancer1408/bark-es-tokenizer",
            "portuguese-HuBERT-quantizer_24_epoch.pth @ MadVoyager/bark-voice-cloning-portuguese-HuBERT-quantizer",
          ].map((bandwidth) => (
            <option key={bandwidth} value={bandwidth}>
              {bandwidth}
            </option>
          ))}
        </select>
      </div>
      <div className="flex space-x-4">
        <div className="flex flex-col space-y-2">
          <AudioInput
            url={barkVoiceGenerationParams?.audio}
            callback={(file) => {
              setBarkVoiceGenerationParams({
                ...barkVoiceGenerationParams,
                audio: file,
              });
            }}
            filter={["sendToBarkVoiceGeneration"]}
          />

          {/* use_gpu checkbox */}
          <div className="space-y-2">
            <label className="text-sm">Use GPU:</label>
            <input
              type="checkbox"
              name="use_gpu"
              id="use_gpu"
              checked={barkVoiceGenerationParams.use_gpu}
              onChange={(e) =>
                setBarkVoiceGenerationParams({
                  ...barkVoiceGenerationParams,
                  [e.target.name]: e.target.checked,
                })
              }
            />
          </div>

          <button
            className="border border-gray-300 p-2 rounded"
            onClick={barkVoiceGeneration}
          >
            Generate Bark Voice
          </button>
        </div>
        <div className="flex flex-col space-y-4">
          {/* Print voice filename */}
          <div className="space-y-2">
            <label className="text-sm">Voice file name:</label>
            <input
              type="text"
              name="filename"
              id="filename"
              className="border border-gray-300 p-2 rounded text-black w-full"
              value={data?.filename}
              readOnly
            />
          </div>

          <AudioOutput
            audioOutput={data?.preview}
            label="Encodec audio preview"
            funcs={[useAsInput]}
            filter={["sendToBarkVoiceGeneration"]}
          />
        </div>
      </div>
    </Template>
  );
};

export default BarkVoiceGenerationPage;
