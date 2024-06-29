import React from "react";
import FileInput from "./FileInput";
import { AudioPlayer } from "./MemoizedWaveSurferPlayer";
import { WaveSurferOptions } from "wavesurfer.js";
import { sendToDemucs } from "../tabs/DemucsParams";
import { sendToMusicgen } from "../tabs/MusicgenParams";
import { sendToVocos } from "../tabs/VocosParams";
import { GradioFile } from "../types/GradioFile";
import { sendToBarkVoiceGeneration } from "../tabs/BarkVoiceGenerationParams";

export const AudioInput = ({
  callback,
  funcs,
  url,
  label,
  filter,
  metadata,
}: {
  callback: (melody?: string) => void;
  funcs?: Record<string, (audio: string | undefined | any) => void>;
  url?: string;
  label?: string;
  filter?: string[];
  metadata?: any;
}) => (
  <div className="border border-gray-300 p-2 rounded flex flex-col space-y-2">
    <p className="text-sm">{label || "Input file:"}</p>
    <FileInput callback={(file?: string) => callback(file)} />
    <AudioPlayerHelper
      url={url}
      funcs={funcs}
      filter={filter}
      metadata={metadata}
    />
  </div>
);

export const AudioOutput = ({
  audioOutput,
  label,
  funcs,
  filter,
  metadata,
}: {
  audioOutput?: GradioFile;
  label: string;
  funcs?: Record<string, (audio: string | undefined | any) => void>;
  filter?: string[];
  metadata?: any;
}) => {
  return (
    <div className="border border-gray-300 p-2 rounded">
      <p className="text-sm">{label}</p>
      {audioOutput && (
        <AudioPlayerHelper
          url={audioOutput.data}
          funcs={funcs}
          filter={filter}
          metadata={metadata}
        />
      )}
    </div>
  );
};

const sendToFuncs = {
  sendToDemucs,
  sendToMusicgen,
  sendToVocos,
  sendToBarkVoiceGeneration,
} as Record<string, (audio: string | undefined) => void>;

const listOfFuncs = Object.keys(sendToFuncs);

const AudioPlayerHelper = (
  props: Omit<WaveSurferOptions, "container"> & {
    volume?: number;
    filter?: string[];
    // sendAudioTo?: Array<(audio: string | undefined) => void>;
    metadata?: any;
    // funcs?: Array<(metadata: string | any) => void>;
    funcs?: Record<string, (audio: string | undefined | any) => void>;
  }
) => {
  const { filter: outputFilters, funcs, url, volume, metadata } = props;
  return (
    <>
      <AudioPlayer
        height={100}
        waveColor="#ffa500"
        progressColor="#d59520"
        barWidth={2}
        barGap={1}
        barRadius={2}
        volume={volume || 0.4}
        url={url}
      />
      <div className="mt-2 flex flex-wrap gap-1">
        {funcs &&
          Object.entries(funcs).map(([funcName, func]) => (
            <FuncButton
              key={funcName}
              name={funcName}
              func={func}
              url={url}
              metadata={metadata}
            />
          ))}

        {listOfFuncs
          .filter((funcName) =>
            outputFilters ? !outputFilters.includes(funcName) : true
          )
          .map((funcName) => (
            <FuncButton
              key={funcName}
              name={funcName}
              func={sendToFuncs[funcName]}
              url={url}
              metadata={metadata}
            />
          ))}
        <DownloadButton url={url} />
      </div>
    </>
  );
};

const DownloadButton = ({ url }: { url?: string }) => {
  const [downloadURL, setDownloadURL] = React.useState<string | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (!url) return;
    const download = (url) => {
      if (!url) {
        throw new Error("Resource URL not provided! You need to provide one");
      }
      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          const blobURL = URL.createObjectURL(blob);
          setDownloadURL(blobURL);
        })
        .catch((e) => console.log("=== Error downloading", e));
    };
    download(url);
  }, [url]);

  return (
    <a
      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded inline-block text-sm"
      href={downloadURL}
      download="audio.wav"
    >
      Download
    </a>
  );
};

const FuncButton = ({
  func,
  name,
  url,
  metadata,
}: {
  func: (audio: string | undefined | any, metadata?: any) => void;
  name: string;
  url: string | undefined | any;
  metadata?: any;
}) => (
  <button
    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm"
    onClick={() => func(url, metadata)}
  >
    {name.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
  </button>
);
