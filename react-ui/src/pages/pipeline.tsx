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
import { RVCInputs } from "../components/RVCInputs";
import { useRVCGenerationParams } from "../tabs/RVCParams";
import { applyRVC } from "../functions/applyRVC";
import { TortoiseInput } from "../components/TortoiseInput";
import { generateWithTortoise } from "./generateWithTortoise";
import { useTortoiseGenerationParams } from "../tabs/TortoiseGenerationParams";
import { parseFormChange } from "./parseFormChange";

interface PipelineParams {
  generation: string;
  refinement: string;
}

const initialState: PipelineParams = {
  generation: "bark",
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

  const [barkGenerationParams, setBarkVoiceGenerationParams] =
    useBarkGenerationParams();

  const [rvcGenerationParams, setRvcGenerationParams] =
    useRVCGenerationParams();

  const [tortoiseGenerationParams, setTortoiseGenerationParams] =
    useTortoiseGenerationParams();

  async function pipeline() {
    if (pipelineParams.generation === "bark") {
      const result = await barkGenerate(barkGenerationParams);
      setBarkResult(result);
      if (pipelineParams.refinement === "none") {
        setData([result.audio]);
      }
      if (pipelineParams.refinement === "demucs") {
        const demucsParams: DemucsParams = {
          file: result.audio.data,
        };
        const result2 = await splitWithDemucs(demucsParams);
        setData(result2);
      }
      if (pipelineParams.refinement === "rvc") {
        const result3 = await applyRVC({
          ...rvcGenerationParams,
          original_audio: result.audio.data,
        });
        setData([result3.audio]);
      }
    }
    if (pipelineParams.generation === "tortoise") {
      const result = await generateWithTortoise(tortoiseGenerationParams);
      if (pipelineParams.refinement === "none") {
        setData([result.audio]);
      }
      if (pipelineParams.refinement === "demucs") {
        const demucsParams: DemucsParams = {
          file: result.audio.data,
        };
        const result2 = await splitWithDemucs(demucsParams);
        setData(result2);
      }
      if (pipelineParams.refinement === "rvc") {
        const result3 = await applyRVC({
          ...rvcGenerationParams,
          original_audio: result.audio.data,
        });
        setData([result3.audio]);
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
            generation model to generate a representation of the audio. This
            representation is then refined by a refinement model to generate a
            new audio file.
          </p>
          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <label>Choose a generation model:</label>
            {["bark", "tortoise"].map((model) => (
              <div key={model} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="generation"
                  id={model}
                  value={model}
                  checked={pipelineParams.generation === model}
                  onChange={() =>
                    setPipelineParams((x) => ({ ...x, generation: model }))
                  }
                />
                <label htmlFor={model}>{model}</label>
              </div>
            ))}
          </div>
          {pipelineParams.generation === "bark" && (
            <BarkInputs
              barkGenerationParams={barkGenerationParams}
              setBarkVoiceGenerationParams={setBarkVoiceGenerationParams}
              handleChange={parseFormChange(setBarkVoiceGenerationParams)}
              data={null}
            />
          )}
          {/* if tortoise */}
          {pipelineParams.generation === "tortoise" && (
            <TortoiseInput
              tortoiseGenerationParams={tortoiseGenerationParams}
              setTortoiseGenerationParams={setTortoiseGenerationParams}
              handleChange={parseFormChange(setTortoiseGenerationParams)}
              data={null}
            />
          )}
          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <label>Choose a refinement model:</label>
            {["none", "rvc", "demucs"].map((model) => (
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
          {pipelineParams.refinement === "rvc" && (
            <RVCInputs
              rvcParams={rvcGenerationParams}
              handleChange={parseFormChange(setRvcGenerationParams)}
            />
          )}
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
