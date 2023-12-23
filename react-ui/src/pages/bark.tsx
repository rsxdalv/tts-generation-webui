import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import {
  BarkGenerationParams,
  barkGenerationId,
  initialState,
} from "../tabs/BarkGenerationParams";
import { GradioFile } from "../types/GradioFile";

type Result = {
  audio: GradioFile;
  image: string;
  save_button: Object;
  continue_button: Object;
  buttons_row: Object;
  npz: null;
  seed: null;
  json_text: null;
  history_bundle_name_data: null;
};

const BarkVoiceGenerationPage = () => {
  const [data, setData] = useLocalStorage<Result | null>(
    "barkGenerationOutput",
    null
  );
  const [barkGenerationParams, setBarkVoiceGenerationParams] =
    useLocalStorage<BarkGenerationParams>(barkGenerationId, initialState);

  async function barkGeneration() {
    const response = await fetch("/api/gradio/bark", {
      method: "POST",
      body: JSON.stringify(barkGenerationParams),
    });

    const result = await response.json();
    setData(result);
  }

  const useAsInput = (audio?: string) => {
    return;
  };

  // async function barkTokenizerLoad(
  //   barkGenerationParams: BarkGenerationParams
  // ) {
  //   const response = await fetch("/api/gradio/bark_voice_tokenizer_load", {
  //     method: "POST",
  //     body: JSON.stringify(barkGenerationParams),
  //   });

  //   const result = await response.json();
  //   // setData(result);
  // }

  // const useAsInput = (audio?: string) => {
  //   if (!audio) return;
  //   setBarkVoiceGenerationParams({
  //     ...barkGenerationParams,
  //     audio,
  //   });
  // };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = {
      ...barkGenerationParams,
      [e.target.name]: e.target.value,
    };
    setBarkVoiceGenerationParams(newParams);
    // barkTokenizerLoad(newParams);
  };

  return (
    <Template>
      <Head>
        <title>Vocos - TTS Generation Webui</title>
      </Head>
      {/* <div className="space-y-2">
        <label className="text-sm">Tokenizer:</label>
        <select
          name="tokenizer"
          id="tokenizer"
          className="border border-gray-300 p-2 rounded text-black"
          value={barkGenerationParams?.tokenizer}
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
      </div> */}
      <div className="flex space-x-4">
        <div className="flex flex-col space-y-2">
          {/* <AudioInput
            url={barkGenerationParams?.audio}
            callback={(file) => {
              setBarkVoiceGenerationParams({
                ...barkGenerationParams,
                audio: file,
              });
            }}
            filter={["sendToBarkVoiceGeneration"]}
          /> */}

          {/* use_gpu checkbox */}
          {/* <div className="space-y-2">
            <label className="text-sm">Use GPU:</label>
            <input
              type="checkbox"
              name="use_gpu"
              id="use_gpu"
              checked={barkGenerationParams.use_gpu}
              onChange={(e) =>
                setBarkVoiceGenerationParams({
                  ...barkGenerationParams,
                  [e.target.name]: e.target.checked,
                })
              }
            />
          </div> */}

          <button
            className="border border-gray-300 p-2 rounded"
            onClick={barkGeneration}
          >
            Generate
          </button>
        </div>
        <div className="flex flex-col space-y-4">
          {/* Print voice filename */}
          {/* <div className="space-y-2">
            <label className="text-sm">Voice file name:</label>
            <input
              type="text"
              name="filename"
              id="filename"
              className="border border-gray-300 p-2 rounded text-black w-full"
              value={data?.filename}
              readOnly
            />
          </div> */}

          <AudioOutput
            audioOutput={data?.audio}
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
