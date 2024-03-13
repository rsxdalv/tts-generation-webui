import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import { GradioFile } from "../types/GradioFile";
import { DemucsParams } from "../tabs/DemucsParams";
import { splitWithDemucs } from "../functions/splitWithDemucs";
import { barkGenerate } from "../functions/barkGenerate";
import { BarkInputs } from "../components/BarkInputs";
import {
  useBarkGenerationParams,
  useBarkResult,
} from "../tabs/BarkGenerationParams";
import { RVCInputs } from "../components/RVCInputs";
import { useRVCGenerationParams } from "../tabs/RVCParams";
import { applyRVC } from "../functions/applyRVC";
import { TortoiseInput } from "../components/TortoiseInput";
import { generateWithTortoise } from "../functions/generateWithTortoise";
import {
  useTortoiseGenerationParams,
  useTortoiseResult,
} from "../tabs/TortoiseGenerationParams";
import { parseFormChange } from "../data/parseFormChange";

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
  const [output, setOutput] = useLocalStorage<GradioFile[] | null>(
    "pipelineOutput",
    null
  );
  const [pipelineParams, setPipelineParams] = useLocalStorage<PipelineParams>(
    pipelineId,
    initialState
  );

  const [barkGenerationParams, setBarkVoiceGenerationParams] =
    useBarkGenerationParams();
  const [barkResult, setBarkResult] = useBarkResult();

  const [tortoiseGenerationParams, setTortoiseGenerationParams] =
    useTortoiseGenerationParams();
  const [tortoiseResult, setTortoiseResult] = useTortoiseResult();

  const [rvcGenerationParams, setRvcGenerationParams] =
    useRVCGenerationParams();

  async function pipeline() {
    if (pipelineParams.generation === "bark") {
      const result = await barkGenerate(barkGenerationParams);
      setBarkResult(result);
      await postProcessAudio(result.audio);
    } else if (pipelineParams.generation === "tortoise") {
      const result = await generateWithTortoise(tortoiseGenerationParams);
      setTortoiseResult(result);
      await postProcessAudio(result.audio);
    }

    async function postProcessAudio(audio: GradioFile) {
      if (pipelineParams.refinement === "none") {
        setOutput([audio]);
      } else if (pipelineParams.refinement === "demucs") {
        const demucsParams: DemucsParams = {
          file: audio.data,
        };
        const result2 = await splitWithDemucs(demucsParams);
        setOutput(result2);
      } else if (pipelineParams.refinement === "rvc") {
        const result3 = await applyRVC({
          ...rvcGenerationParams,
          original_audio: audio.data,
        });
        setOutput([result3.audio]);
      }
    }
  }

  return (
    <Template>
      <Head>
        <title>Pipeline - TTS Generation Webui</title>
      </Head>
      <div className="flex flex-col gap-y-4 p-4">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl font-bold">
            Description (Experimental, subject to change)
          </h1>
          <p>
            This pipeline takes an audio file as input and runs it through a
            generation model to generate a representation of the audio. This
            representation is then refined by a refinement model to generate a
            new audio file.
          </p>
          <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded mb-4">
            <label>Choose a generation model:</label>
            {["bark", "tortoise", "musicgen", "magnet"].map((model) => (
              <div key={model} className="flex items-center gap-x-2">
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
              data={barkResult}
            />
          )}
          {pipelineParams.generation === "tortoise" && (
            <TortoiseInput
              tortoiseGenerationParams={tortoiseGenerationParams}
              setTortoiseGenerationParams={setTortoiseGenerationParams}
              handleChange={parseFormChange(setTortoiseGenerationParams)}
              data={tortoiseResult}
            />
          )}
          {pipelineParams.generation === "musicgen" && (
            <div>
              <label>Music Generation</label>
            </div>
          )}
          {pipelineParams.generation === "magnet" && (
            <div>
              <label>Magnet Generation</label>
            </div>
          )}
          <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded mb-4">
            <label>Choose a refinement model:</label>
            {["none", "rvc", "demucs"].map((model) => (
              <div key={model} className="flex items-center gap-x-2">
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
          {pipelineParams.refinement === "rvc" && (
            <RVCInputs
              rvcParams={rvcGenerationParams}
              handleChange={parseFormChange(setRvcGenerationParams)}
              hideAudioInput
            />
          )}
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={pipeline}
          >
            Run Pipeline
          </button>
        </div>
        <div className="flex flex-col gap-y-4">
          {output &&
            output.map((item, index) => (
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
