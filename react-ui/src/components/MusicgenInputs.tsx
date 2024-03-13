import React from "react";
import { AudioInput } from "./AudioComponents";
import {
  MusicgenParams,
  MusicgenResult,
  initialMusicgenParams,
} from "../tabs/MusicgenParams";
import { MusicgenModelSelector } from "./MusicgenModelSelector";

export const MusicgenInputs = ({
  musicgenParams,
  handleChange,
  setMusicgenParams,
  musicgenResult,
}: {
  musicgenParams: MusicgenParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
  setMusicgenParams: React.Dispatch<React.SetStateAction<MusicgenParams>>;
  musicgenResult: MusicgenResult | null;
}) => (
  <div className="flex gap-x-6 w-full justify-center">
    <div className="flex flex-col gap-y-2 w-1/2">
      <label className="text-sm">Text:</label>
      <textarea
        name="text"
        value={musicgenParams.text}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded"
        placeholder="Enter text here..."
        rows={3}
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
      <label className="text-sm">
        Duration: {musicgenParams.duration}s{" "}
        {musicgenParams.duration > 30 && "(spliced)"}
      </label>
      <input
        type="range"
        name="duration"
        value={musicgenParams.duration}
        onChange={handleChange}
        className="border border-gray-300 py-2 rounded"
        min="0.5"
        max="360"
        step="0.5"
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

      <label className="text-sm">Top-P: {musicgenParams.topp}</label>
      <input
        type="range"
        name="topp"
        value={musicgenParams.topp}
        onChange={handleChange}
        className="border border-gray-300 py-2 rounded"
        min="0"
        max="1.5"
        step="0.01"
      />

      <label className="text-sm">
        Temperature: {musicgenParams.temperature}
      </label>
      <input
        type="range"
        name="temperature"
        value={musicgenParams.temperature}
        onChange={handleChange}
        className="border border-gray-300 py-2 rounded"
        min="0"
        max="1.5"
        step="0.01"
      />

      <label className="text-sm">
        Classifier Free Guidance Coefficient:{" "}
        {musicgenParams.cfg_coef.toFixed(1)}
      </label>
      <input
        type="range"
        name="cfg_coef"
        value={musicgenParams.cfg_coef}
        onChange={handleChange}
        className="border border-gray-300 py-2 rounded"
        min="0"
        max="10"
        step="0.1"
      />

      <label className="text-sm">Seed:</label>
      <input
        type="number"
        name="seed"
        value={musicgenParams.seed}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded"
      />
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={() =>
          setMusicgenParams({
            ...musicgenParams,
            seed: Number(musicgenResult?.json.seed) || -1,
          })
        }
      >
        Restore Last Seed
      </button>

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
