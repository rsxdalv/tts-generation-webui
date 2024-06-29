import React from "react";
import { AudioInput } from "./AudioComponents";
import {
  MusicgenParams,
  MusicgenResult,
  initialMusicgenParams,
} from "../tabs/MusicgenParams";
import { MusicgenModelSelector } from "./MusicgenModelSelector";
import { GenericSlider } from "./GenericSlider";
import { PromptTextArea } from "./PromptTextArea";
import { HandleChange } from "../types/HandleChange";
import { SeedInput } from "./SeedInput";

export const MusicgenInputs = ({
  musicgenParams,
  handleChange,
  setMusicgenParams,
  musicgenResult,
}: {
  musicgenParams: MusicgenParams;
  handleChange: HandleChange;
  setMusicgenParams: React.Dispatch<React.SetStateAction<MusicgenParams>>;
  musicgenResult: MusicgenResult | null;
}) => (
  <div className="flex gap-x-6 w-full justify-center">
    <div className="flex flex-col gap-y-2 w-1/2">
      <PromptTextArea
        handleChange={handleChange}
        label="Text"
        params={musicgenParams}
        name="text"
      />

      <MusicgenModelSelector
        musicgenParams={musicgenParams}
        setMusicgenParams={setMusicgenParams}
      />
      <AudioInput
        url={musicgenParams.melody}
        label="Melody"
        callback={(file) => {
          setMusicgenParams({
            ...musicgenParams,
            melody: file,
          });
        }}
        filter={["sendToMusicgen"]}
      />
    </div>

    <div className="flex flex-col gap-y-2">
      <GenericSlider
        label="Duration"
        format={(x) => `${x.toFixed(1)}s ${x > 30 ? "(spliced)" : ""}`}
        name="duration"
        min="0.5"
        max="360"
        step="0.5"
        params={musicgenParams}
        handleChange={handleChange}
      />

      <label className="text-sm">Top-K:</label>
      <input
        type="number"
        name="topk"
        value={musicgenParams.topk}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded"
        min="0"
        max="250"
        step="1"
      />

      <GenericSlider
        label="Top-P"
        format={(x) => x.toFixed(2)}
        name="topp"
        min="0"
        max="1.5"
        step="0.01"
        params={musicgenParams}
        handleChange={handleChange}
      />

      <GenericSlider
        label="Temperature"
        format={(x) => x.toFixed(2)}
        name="temperature"
        min="0"
        max="1.5"
        step="0.01"
        params={musicgenParams}
        handleChange={handleChange}
      />

      <GenericSlider
        label="Classifier Free Guidance Coefficient"
        format={(x) => x.toFixed(1)}
        name="cfg_coef"
        min="0"
        max="10"
        step="0.1"
        params={musicgenParams}
        handleChange={handleChange}
      />

      <SeedInput
        params={musicgenParams}
        setParams={setMusicgenParams}
        handleChange={handleChange}
        seed={musicgenResult?.json?.seed}
      />

      <div className="flex gap-x-2 items-center">
        <label className="text-sm">
          Use{" "}
          <a
            className="underline"
            href="https://huggingface.co/facebook/multiband-diffusion"
            target="_blank"
          >
            Multi Band Diffusion (High VRAM Usage):
          </a>
        </label>
        <input
          type="checkbox"
          name="use_multi_band_diffusion"
          checked={musicgenParams.use_multi_band_diffusion}
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded"
        />
      </div>

      <button
        className="border border-gray-300 p-2 rounded"
        onClick={() => setMusicgenParams(initialMusicgenParams)}
      >
        Reset Parameters
      </button>
    </div>
  </div>
);
