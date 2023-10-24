import React, { useState } from "react";
import { Template } from "../components/Template";
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

function addTypeNameToAudioOutput(audioOutput: AudioOutput, typeName: string) {
  return { ...audioOutput, type_name: typeName };
}

function addTypeNamesToAudioOutputs(
  audioOutputs: AudioOutput[],
  typeNames: string[]
) {
  return audioOutputs.map((audioOutput, index) =>
    addTypeNameToAudioOutput(audioOutput, typeNames[index])
  );
}

type MusicgenParams = {
  file: string | null;
};

const GradioPage = () => {
  const [data, setData] = useState<AudioOutput[] | null>(null);
  const [melody, setMelody] = useState<string | undefined>();

  const [musicgenParams, setMusicgenParams] = useState<MusicgenParams>({
    file: null,
  });

  async function demucs() {
    const response = await fetch("/api/demucs_musicgen", {
      method: "POST",
      body: JSON.stringify(musicgenParams),
    });

    const result = await response.json();
    setData(result?.data);
  }

  const typeNames = ["drums", "bass", "other", "vocals"];
  const sampleWithTypeNames =
    data && addTypeNamesToAudioOutputs(data, typeNames);

  return (
    <Template>
      <div className="p-4">
        <div>
          <label className="text-sm">Input file:</label>
          <FileInput
            callback={(file: File | undefined) => {
              const melody = file?.name || null;
              setMelody(file && URL.createObjectURL(file));
              setMusicgenParams({
                ...musicgenParams,
                file: melody,
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

          <button
            className="border border-gray-300 p-2 rounded"
            onClick={demucs}
          >
            Split with Demucs
          </button>
          {typeNames.map((typeName, index) => {
            const audioOutput = sampleWithTypeNames?.find(
              (item) => item.type_name === typeName
            );
            return (
              <div key={index}>
                <p>{typeName}</p>
                {audioOutput && (
                  <AudioPlayer
                    height={100}
                    waveColor="#ffa500"
                    progressColor="#d59520"
                    url={audioOutput.data}
                    volume={0.4}
                    barWidth={2}
                    barGap={1}
                    barRadius={2}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Template>
  );
};

export default GradioPage;
