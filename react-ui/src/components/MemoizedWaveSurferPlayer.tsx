import React, { useEffect, useRef, useState } from "react";
import { useWavesurfer } from "@/components/useWavesurfer";
import Timeline from "wavesurfer.js/dist/plugins/timeline";
import { WaveSurferOptions } from "wavesurfer.js";

const WaveSurferPlayerRaw = (props) => {
  const containerRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const wavesurfer = useWavesurfer(containerRef, props);

  // On play button click
  // const onPlayClick = useCallback(() => {
  //   if (!wavesurfer) return;
  //   wavesurfer.isPlaying() ? wavesurfer.pause() : wavesurfer.play();
  // }, [wavesurfer]);
  // Initialize wavesurfer when the container mounts
  // or any of the props change
  useEffect(() => {
    if (!wavesurfer) return;

    setCurrentTime(0);
    setIsPlaying(false);

    wavesurfer.setVolume(props.volume);

    const subscriptions = [
      wavesurfer.on("play", () => setIsPlaying(true)),
      wavesurfer.on("pause", () => setIsPlaying(false)),
      wavesurfer.on("timeupdate", (currentTime) => setCurrentTime(currentTime)),
      wavesurfer.on("finish", () => setIsPlaying(false)),
      wavesurfer.on("destroy", () => setIsPlaying(false)),
      wavesurfer.on("interaction", () => wavesurfer.playPause()),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [wavesurfer]);

  // const { volume } = props;
  // useEffect(() => {
  //   if (!wavesurfer) return;
  //   wavesurfer.setVolume(volume);
  // }, [volume]);
  return (
    <>
      <div ref={containerRef} style={{ minHeight: "120px" }} />

      {/* <button onClick={onPlayClick} style={{ marginTop: "1em" }}>
              {isPlaying ? "Pause" : "Play"}
            </button> */}

      {/* <p>Seconds played: {currentTime}</p> */}
    </>
  );
};

// memoize the player component
export const MemoizedWaveSurferPlayer = React.memo(WaveSurferPlayerRaw);
export const AudioPlayer = (
  props: Omit<WaveSurferOptions, "container"> & { volume: number }
) => {
  const [plugins, setPlugins] = useState<any[]>([]);
  useEffect(() => {
    const timeline_plugin = Timeline.create();
    setPlugins([timeline_plugin]);
  }, []);

  return (
    <div className="">
      <MemoizedWaveSurferPlayer {...props} plugins={plugins} />
    </div>
  );
};
