import React, { useState } from "react";
import { Template } from "../components/Template";
import Head from "next/head";
import FileInput from "../components/FileInput";
import { AudioPlayer } from "../components/MemoizedWaveSurferPlayer";

type AudioOutput = {
  name: string;
  data: string;
  size?: number;
  is_file?: boolean;
  orig_name?: string;
  type_name?: string;
};

const musicgenParams0 = {
  // text: "",
  text: "lofi hip hop beats to relax/study to",
  melody:
    "http://127.0.0.1:7865/file=C:/Users/admin/AppData/Local/Temp/gradio/f3d0773300bcd266ee61beb5561678a0a2802cea/audio.wav",
  model: "facebook/musicgen-small",
  duration: 1,
  topk: 250,
  topp: 0,
  temperature: 1.0,
  cfg_coef: 3.0,
  seed: -1,
  use_multi_band_diffusion: false,
};

type MusicgenParams = {
  text: string;
  melody: string | null;
  model: string;
  duration: number;
  topk: number;
  topp: number;
  temperature: number;
  cfg_coef: number;
  seed: number;
  use_multi_band_diffusion: boolean;
};

const GradioPage = () => {
  const [musicgenData, setMusicgenData] = useState<AudioOutput[] | null>(null);
  const [historyData, setHistoryData] = useState<AudioOutput[]>([]);
  const [lastSeed, setLastSeed] = useState<number>(-1);
  const [image, setImage] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [musicgenParams, setMusicgenParams] =
    useState<MusicgenParams>(musicgenParams0);
  const [melody, setMelody] = useState<string | undefined>();

  async function musicgen() {
    console.log(musicgenParams);
    const body = JSON.stringify({
      ...musicgenParams,
      melody:
        musicgenParams.model === "facebook/musicgen-melody"
          ? musicgenParams.melody
          : null,
    });
    // return;
    const response = await fetch("/api/demucs_musicgen", {
      method: "POST",
      body,
    });

    const result = await response.json();
    const data = result?.data;
    const [generated_audio, , image, , json] = data;
    console.log(generated_audio, image, json);
    const { seed } = json;
    setMusicgenData(result?.data);
    setHistoryData((x) => [result?.data[0], ...x]);
    setLastSeed(seed);
    setImage(image);
    setAudioUrl(generated_audio.data);
  }

  const handleChange = async (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;

    if (name === "melody") {
      if (!(event.target instanceof HTMLInputElement)) return;
      const file = event.target.files?.[0];
      console.log(file);
      const reader = new FileReader();
      reader.readAsDataURL(file!);
      console.log(reader);
      console.log(reader.result);
      setMusicgenParams({
        ...musicgenParams,
        [name]: reader.result,
      });
      return;
    }

    setMusicgenParams({
      ...musicgenParams,
      [name]:
        type === "number" || type === "range"
          ? Number(value)
          : type === "checkbox"
          ? (event.target as HTMLInputElement).checked // type assertion
          : value,
    });
  };

  return (
    <Template>
      <Head>
        <title>TTS Generation Webui - Musicgen</title>
      </Head>
      <div className="p-4">
        <div className="my-4">
          <div className="flex space-x-6 w-full">
            <div className="flex flex-col space-y-2">
              <label className="text-sm">Text:</label>
              <textarea
                name="text"
                value={musicgenParams.text}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
                placeholder="Enter text here..."
                rows={3}
              />

              <div className="space-y-2">
                <label className="text-sm">Model:</label>
                <div className="flex flex-col space-y-2">
                  {[
                    "facebook/musicgen-melody",
                    "facebook/musicgen-medium",
                    "facebook/musicgen-small",
                    "facebook/musicgen-large",
                    "facebook/audiogen-medium",
                  ].map((model) => (
                    <div key={model} className="flex items-center">
                      <input
                        type="radio"
                        name="model"
                        value={model}
                        checked={musicgenParams.model === model}
                        onChange={handleChange}
                        className="border border-gray-300 p-2 rounded"
                      />
                      <label className="ml-1">{model}</label>
                    </div>
                  ))}
                </div>
              </div>

              <label className="text-sm">Melody:</label>
              <FileInput
                callback={(file: File | undefined) => {
                  const melody = file?.name || null;
                  setMelody(file && URL.createObjectURL(file));
                  setMusicgenParams({
                    ...musicgenParams,
                    melody,
                  });
                }}
              />
              {/* Preview melody */}
              <AudioPlayer
                height={100}
                waveColor="#ffa500"
                progressColor="#d59520"
                url={melody}
                volume={0.4}
                barWidth={2}
                barGap={1}
                barRadius={2}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm">
                Duration: {musicgenParams.duration}s
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
                Classifier Free Guidance Coefficient: {musicgenParams.cfg_coef}
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
                    seed: lastSeed,
                  })
                }
              >
                Restore Last Seed
              </button>

              <div className="flex space-x-2 items-center">
                <label className="text-sm">Use Multi Band Diffusion:</label>
                <input
                  type="checkbox"
                  name="use_multi_band_diffusion"
                  checked={musicgenParams.use_multi_band_diffusion}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="my-4 flex flex-col space-y-2">
          <div>
            <label className="text-sm">Output:</label>
            <AudioPlayer
              height={100}
              waveColor="#ffa500"
              progressColor="#d59520"
              url={audioUrl}
              volume={0.4}
              barWidth={2}
              barGap={1}
              barRadius={2}
            />
          </div>
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={musicgen}
          >
            Generate
          </button>
        </div>

        {/* History */}
        <div className="my-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm">History:</label>
            <div className="flex flex-col space-y-2">
              {historyData &&
                historyData.map((item, index) => (
                  // <div key={index}>
                  //   <audio src={item.data} controls></audio>
                  // </div>
                  <AudioPlayer
                    height={100}
                    waveColor="#ffa500"
                    progressColor="#d59520"
                    url={item.data}
                    volume={0.4}
                    // // Set a bar width
                    // barWidth: 2,
                    // // Optionally, specify the spacing between bars
                    // barGap: 1,
                    // // And the bar radius
                    // barRadius: 2,
                    barWidth={2}
                    barGap={1}
                    barRadius={2}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </Template>
  );
};

export default GradioPage;
