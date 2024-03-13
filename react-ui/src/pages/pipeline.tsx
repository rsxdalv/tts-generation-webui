import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import { GradioFile } from "../types/GradioFile";
import { DemucsParams } from "../tabs/DemucsParams";
import { splitWithDemucs } from "../functions/splitWithDemucs";
import { barkGenerate } from "../functions/barkGenerate";
import { BarkInputs } from "../components/BarkInputs";
import { useBarkGenerationParams } from "../tabs/BarkGenerationParams";
import { BarkResult } from "../tabs/BarkResult";

interface PipelineParams {
  foundation: string;
  refinement: string;
}

const initialState: PipelineParams = {
  foundation: "bark",
  refinement: "demucs",
};

const pipelineId = "pipeline";

const PipelinePage = () => {
  const [barkResult, setBarkResult] = useLocalStorage<BarkResult | null>(
    "barkGenerationOutput",
    null
  );
  const [data, setData] = useLocalStorage<GradioFile[] | null>(
    "pipelineOutput",
    null
  );
  const [pipelineParams, setPipelineParams] = useLocalStorage<PipelineParams>(
    pipelineId,
    initialState
  );

  console.log("pipelineParams", pipelineParams);

  const [barkGenerationParams, setBarkVoiceGenerationParams] =
    useBarkGenerationParams();

  async function pipeline() {
    if (pipelineParams.foundation === "bark") {
      const result = await barkGenerate(barkGenerationParams);
      setBarkResult(result);
      if (pipelineParams.refinement === "demucs") {
        const demucsParams: DemucsParams = {
          // file: pipelineParams.file,
          // file: "???",
          file: result.audio.data,
        };
        const result2 = await splitWithDemucs(demucsParams);
        setData(result2);
      }
    }
  }

  return (
    <Template>
      <Head>
        <title>Pipeline - TTS Generation Webui</title>
      </Head>
      <div className="flex flex-col space-x-4 p-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">
            Description (Experimental, subject to change)
          </h1>
          <p>
            This pipeline takes an audio file as input and runs it through a
            foundation model to generate a representation of the audio. This
            representation is then refined by a refinement model to generate a
            new audio file.
          </p>
          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <label>Choose a foundation model:</label>
            {/* {["bark", "tortoise"].map((model) => ( */}
            {["bark"].map((model) => (
              <div key={model} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="foundation"
                  id={model}
                  value={model}
                  checked={pipelineParams.foundation === model}
                  onChange={() =>
                    setPipelineParams((x) => ({ ...x, foundation: model }))
                  }
                />
                <label htmlFor={model}>{model}</label>
              </div>
            ))}
          </div>
          {pipelineParams.foundation === "bark" && (
            <BarkInputs
              barkGenerationParams={barkGenerationParams}
              setBarkVoiceGenerationParams={setBarkVoiceGenerationParams}
              handleChange={(
                event:
                  | React.ChangeEvent<HTMLInputElement>
                  | React.ChangeEvent<HTMLTextAreaElement>
                  | React.ChangeEvent<HTMLSelectElement>
              ) => {
                const { name, value, type } = event.target;
                setBarkVoiceGenerationParams({
                  ...barkGenerationParams,
                  [name]:
                    type === "number" || type === "range"
                      ? Number(value)
                      : type === "checkbox"
                      ? (event.target as HTMLInputElement).checked // type assertion
                      : value,
                });
              }}
              data={null}
            />
          )}
          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <label>Choose a refinement model:</label>
            {/* {["rvc", "demucs"].map((model) => ( */}
            {["demucs"].map((model) => (
              <div key={model} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="refinement"
                  id={model}
                  value={model}
                  checked={pipelineParams.refinement === model}
                  onChange={() =>
                    setPipelineParams((x) => ({ ...x, refinement: model }))
                  }
                />
                <label htmlFor={model}>{model}</label>
              </div>
            ))}
          </div>
          {/* if rvc */}
          {/* {pipelineParams.refinement === "rvc" && (
            <RVCParameters
              rvcParams={rvcGenerationParams}
              handleChange={handleChange}
            />
          )} */}
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={pipeline}
          >
            Run Pipeline
          </button>
        </div>
        <div className="flex flex-col space-y-4">
          {data &&
            data.map((item, index) => (
              <AudioOutput
                key={index}
                audioOutput={item}
                label={item.name}
                funcs={{}}
                metadata={item}
                filter={["sendToPipeline"]}
              />
            ))}
        </div>
      </div>
    </Template>
  );
};

export default PipelinePage;
