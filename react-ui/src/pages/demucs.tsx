import React, { useState } from "react";
import { Template } from "../components/Template";
import FileInput from "../components/FileInput";
import { AudioPlayer } from "../components/MemoizedWaveSurferPlayer";
import { WaveSurferOptions } from "wavesurfer.js";

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

  const [musicgenParams, setMusicgenParams] = useState<MusicgenParams>({
    // file: null,
    file: "https://www.mfiles.co.uk/mp3-downloads/gs-cd-track2.mp3",
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
          <MusicFileInput
            callback={(melody) => {
              setMusicgenParams({
                ...musicgenParams,
                file: melody,
              });
            }}
            sendAudioTo={(audio) => {
              setData([
                {
                  name: "demucs",
                  data: audio || "",
                  type_name: "melody",
                  is_file: false,
                  orig_name: "melody",
                  size: 0,
                },
              ]);
            }}
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
              <MusicFileOutput
                audioOutput={audioOutput}
                label={typeName}
                sendAudioTo={(audio) => {
                  setData([
                    {
                      name: "demucs",
                      data: audio || "",
                      type_name: typeName,
                    },
                  ]);
                }}
              />
            );
          })}
        </div>
      </div>
    </Template>
  );
};

export default GradioPage;

const MusicFileInput = ({
  callback,
  sendAudioTo,
}: {
  callback: (melody: string | null) => void;
  sendAudioTo: (audio: string | undefined) => void;
}) => {
  const [melody, setMelody] = useState<string | undefined>(undefined);

  return (
    <div className="mt-4 border border-gray-300 p-2 rounded">
      <label className="text-sm">Input file:</label>
      <FileInput
        callback={(file: File | undefined) => {
          const melody = file?.name || null;
          setMelody(file && URL.createObjectURL(file));
          callback(melody);
        }}
      />
      <AudioPlayerHelper url={melody} sendAudioTo={sendAudioTo} />
    </div>
  );
};

const MusicFileOutput = ({
  audioOutput,
  label,
  sendAudioTo,
}: {
  audioOutput?: AudioOutput;
  label: string;
  sendAudioTo: (audio: string | undefined) => void;
}) => {
  return (
    <div className="mt-4 border border-gray-300 p-2 rounded">
      <p className="text-sm">{label}</p>
      {audioOutput && (
        <>
          <AudioPlayerHelper url={audioOutput.data} sendAudioTo={sendAudioTo} />
          <AudioOutputInfo audioOutput={audioOutput} />
        </>
      )}
    </div>
  );
};

const AudioPlayerHelper = (
  props: Omit<WaveSurferOptions, "container"> & {
    volume?: number;
    sendAudioTo: (audio: string | undefined) => void;
  }
) => {
  return (
    <>
      <AudioPlayer
        height={100}
        waveColor="#ffa500"
        progressColor="#d59520"
        volume={0.4}
        barWidth={2}
        barGap={1}
        barRadius={2}
        {...props}
      />
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => props.sendAudioTo(props.url)}
      >
        Send Audio
      </button>
      <a
        // className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        // equalize with <button>
        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded inline-block"
        href={props.url}
        download
      >
        Download
      </a>
    </>
  );
};

const AudioOutputInfo = ({ audioOutput }: { audioOutput: AudioOutput }) => {
  return (
    <div className="border border-gray-300 p-2 rounded">
      <p className="text-sm">Info</p>
      <div className="flex flex-col text-xs">
        <div className="flex flex-row">
          <div className="w-1/3">Name</div>
          <div className="w-1/3">{audioOutput.name}</div>
        </div>
        <div className="flex flex-row">
          <div className="w-1/3">Original name</div>
          <div className="w-1/3">{audioOutput.orig_name}</div>
        </div>
        <div className="flex flex-row">
          <div className="w-1/3">Type name</div>
          <div className="w-1/3">{audioOutput.type_name}</div>
        </div>
        <div className="flex flex-row">
          <div className="w-1/3">Size</div>
          <div className="w-1/3">{audioOutput.size}</div>
        </div>
        <div className="flex flex-row">
          <div className="w-1/3">Is file</div>
          <div className="w-1/3">{audioOutput.is_file ? "true" : "false"}</div>
        </div>
      </div>
    </div>
  );
};
