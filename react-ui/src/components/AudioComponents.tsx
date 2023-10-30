import React from "react";
import FileInput, { getAudioURL } from "./FileInput";
import { AudioPlayer } from "./MemoizedWaveSurferPlayer";
import { WaveSurferOptions } from "wavesurfer.js";
import { GradioFile } from "../pages/api/demucs_musicgen";
import { GradioFileInfo } from "../pages/GradioFileInfo";

export const AudioInput = ({
  callback,
  sendAudioTo,
  url,
}: {
  callback: (melody?: string) => void;
  sendAudioTo: (audio?: string) => void;
  url?: string;
}) => (
  <div className="mt-4 border border-gray-300 p-2 rounded">
    <label className="text-sm">Input file:</label>
    <FileInput
      callback={(file?: File) => {
        const melody = getAudioURL(file);
        callback(melody);
      }}
    />
    <AudioPlayerHelper url={url} sendAudioTo={sendAudioTo} />
  </div>
);
export const AudioOutput = ({
  audioOutput,
  label,
  sendAudioTo,
}: {
  audioOutput?: GradioFile;
  label: string;
  sendAudioTo: (audio: string | undefined) => void;
}) => {
  return (
    <div className="mt-4 border border-gray-300 p-2 rounded">
      <p className="text-sm">{label}</p>
      {audioOutput && (
        <>
          <AudioPlayerHelper url={audioOutput.data} sendAudioTo={sendAudioTo} />
          <GradioFileInfo audioOutput={audioOutput} />
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
        barWidth={2}
        barGap={1}
        barRadius={2}
        volume={props.volume || 0.4}
        url={props.url}
      />
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => props.sendAudioTo(props.url)}
      >
        Send Audio
      </button>
      <a
        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded inline-block"
        href={props.url}
        download
      >
        Download
      </a>
    </>
  );
};
