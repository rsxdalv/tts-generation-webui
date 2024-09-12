import React from "react";
import FileInput from "./FileInput";
import { AudioPlayer } from "./MemoizedWaveSurferPlayer";
import { WaveSurferOptions } from "wavesurfer.js";
import { sendToDemucs } from "../tabs/DemucsParams";
import { sendToMusicgen } from "../tabs/MusicgenParams";
import { sendToVocos } from "../tabs/VocosParams";
import { GradioFile } from "../types/GradioFile";
import { sendToBarkVoiceGeneration } from "../tabs/BarkVoiceGenerationParams";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { DownloadIcon } from "lucide-react";
import { Label } from "./ui/label";

export const AudioInput = ({
  callback,
  url,
  label,
  className,
}: {
  callback: (melody?: string) => void;
  funcs?: Record<string, (audio: string | undefined | any) => void>;
  url?: string;
  label?: string;
  filter?: string[];
  metadata?: any;
  className?: string;
}) => (
  <div
    className={cn(
      "cell flex flex-col gap-y-2",
      className
    )}
  >
    <Label>{label || "Input file:"}</Label>
    <FileInput callback={(file?: string) => callback(file)} />
    <AudioPlayer
      height={100}
      waveColor="#ffa500"
      progressColor="#d59520"
      barWidth={2}
      barGap={1}
      barRadius={2}
      volume={0.4}
      url={url}
    />
  </div>
);

export const AudioOutput = ({
  audioOutput,
  label,
  funcs,
  filter,
  metadata,
  className,
  ...props
}: {
  audioOutput?: GradioFile;
  label: string;
  funcs?: Record<string, (audio: string | undefined | any) => void>;
  filter?: string[];
  metadata?: any;
  className?: string;
}) => {
  return (
    <div className={cn("w-full", className)} {...props}>
      <Label>{label}</Label>
      {!audioOutput && <div className="w-full h-1">&nbsp;</div>}
      {audioOutput && (
        <AudioPlayerHelper
          url={audioOutput.url}
          funcs={funcs}
          filter={filter}
          metadata={metadata}
          name={label}
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

const AudioPlayerHelper = ({
  filter: outputFilters,
  funcs,
  url,
  volume,
  metadata,
  name,
}: Omit<WaveSurferOptions, "container"> & {
  volume?: number;
  filter?: string[];
  // sendAudioTo?: Array<(audio: string | undefined) => void>;
  metadata?: any;
  // funcs?: Array<(metadata: string | any) => void>;
  funcs?: Record<string, (audio: string | undefined | any) => void>;
  name?: string;
}) => {
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
        <DownloadButton url={url} name={name} />
      </div>
    </>
  );
};

const DownloadButton = ({
  url,
  name = "audio",
}: {
  url?: string;
  name?: string;
}) => {
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
    <Button variant="outline" size="sm" asChild className="flex-shrink-0">
      <a className="cursor-pointer" href={downloadURL} download={`${name}.wav`}>
        <DownloadIcon className="mr-2 w-5 h-5" />
        Download
      </a>
    </Button>
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
  // <button
  //   className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm"
  //   onClick={() => func(url, metadata)}
  // >
  //   {name.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
  // </button>
  <Button variant="outline" size="sm" onClick={() => func(url, metadata)}>
    {name.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
  </Button>
);
