import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import { GradioFile } from "../types/GradioFile";
import { DemucsParams } from "../tabs/DemucsParams";
import { splitWithDemucs } from "../functions/splitWithDemucs";
import { generateWithBark } from "../functions/generateWithBark";
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
import { useMagnetParams, useMagnetResult } from "../tabs/MagnetParams";
import { generateWithMagnet } from "../functions/generateWithMagnet";
import { MagnetInputs } from "../components/MagnetInputs";
import { useMusicgenParams, useMusicgenResult } from "../tabs/MusicgenParams";
import { generateWithMusicgen } from "../functions/generateWithMusicgen";
import { MusicgenInputs } from "../components/MusicgenInputs";

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
  const [musicgenParams, setMusicgenParams] = useMusicgenParams();
  const [musicgenResult, setMusicgenResult] = useMusicgenResult();
  const [magnetParams, setMagnetParams] = useMagnetParams();
  const [magnetResult, setMagnetResult] = useMagnetResult();

  const [rvcGenerationParams, setRvcGenerationParams] =
    useRVCGenerationParams();

  const [status, setStatus] = React.useState("idle");

  async function pipeline() {
    async function getResult() {
      switch (pipelineParams.generation) {
        case "bark": {
          const result = await generateWithBark(barkGenerationParams);
          setBarkResult(result);
          return result;
        }
        case "tortoise": {
          const result = await generateWithTortoise(tortoiseGenerationParams);
          setTortoiseResult(result);
          return result;
        }
        case "musicgen": {
          const result = await generateWithMusicgen(musicgenParams);
          setMusicgenResult(result);
          return result;
        }
        case "magnet": {
          const result = await generateWithMagnet(magnetParams);
          setMagnetResult(result);
          return result;
        }
      }
    }

    async function postProcessAudio(audio: GradioFile) {
      if (pipelineParams.refinement === "none") {
        setOutput([audio]);
      } else if (pipelineParams.refinement === "demucs") {
        setOutput([audio]);
        const demucsParams: DemucsParams = {
          file: audio.data,
        };
        const result2 = await splitWithDemucs(demucsParams);
        setOutput([audio, ...result2]);
      } else if (pipelineParams.refinement === "rvc") {
        setOutput([audio]);
        const result3 = await applyRVC({
          ...rvcGenerationParams,
          original_audio: audio.data,
        });
        setOutput([audio, result3.audio]);
      }
    }

    setStatus("generating");
    const result = await getResult();
    if (!result) return;
    setStatus("postprocessing");
    await postProcessAudio(result.audio);
    setStatus("idle");
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
            <MusicgenInputs
              musicgenParams={musicgenParams}
              handleChange={parseFormChange(setMusicgenParams)}
              setMusicgenParams={setMusicgenParams}
              musicgenResult={musicgenResult}
            />
          )}
          {pipelineParams.generation === "magnet" && (
            <MagnetInputs
              magnetParams={magnetParams}
              setMagnetParams={setMagnetParams}
              handleChange={parseFormChange(setMagnetParams)}
              data={magnetResult}
            />
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
            {status === "generating" && "Generating..."}
            {status === "postprocessing" && "Postprocessing..."}
            {status === "idle" && "Run Pipeline"}
          </button>
        </div>
        <div className="flex flex-col gap-y-4">
          {output &&
            output.map((item, index) => (
              <AudioOutput
                key={index}
                audioOutput={item}
                label={
                  index === 0
                    ? "Generated Audio"
                    : `Post-processed ${index}/${output.length - 1}`
                }
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
