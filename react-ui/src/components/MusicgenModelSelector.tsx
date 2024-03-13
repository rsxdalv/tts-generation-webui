import React from "react";
import { MusicgenParams } from "../tabs/MusicgenParams";

const modelMap = {
  Small: { size: "small", stereo: true, melody: false },
  Medium: { size: "medium", stereo: true, melody: true },
  Large: { size: "large", stereo: true, melody: true },
  Audiogen: { size: "audiogen", stereo: false, melody: false },
};
const modelToType = {
  "facebook/musicgen-small": "Small",
  "facebook/musicgen-medium": "Medium",
  "facebook/musicgen-large": "Large",
  "facebook/audiogen-medium": "Audiogen",

  "facebook/musicgen-melody": "Medium",
  "facebook/musicgen-melody-large": "Large",

  "facebook/musicgen-stereo-small": "Small",
  "facebook/musicgen-stereo-medium": "Medium",
  "facebook/musicgen-stereo-large": "Large",

  "facebook/musicgen-stereo-melody": "Medium",
  "facebook/musicgen-stereo-melody-large": "Large",
};
const computeModel = (type: string, stereo: boolean, melody: boolean) => {
  const lowerType = type.toLowerCase();
  const largeSuffix = type === "Large" ? "-large" : "";
  const stereoPrefix = stereo ? "-stereo" : "";

  return type === "Audiogen"
    ? `facebook/audiogen-medium`
    : melody && type !== "Small"
    ? `facebook/musicgen${stereoPrefix}-melody${largeSuffix}`
    : `facebook/musicgen${stereoPrefix}-${lowerType}`;
};
const getType = (model: string) => {
  return modelToType[model] || "Small";
};
const decomputeModel = (
  model: string
): { type: string; stereo: boolean; melody: boolean } => {
  const type = getType(model);
  const stereo = model.includes("stereo");
  const melody = model.includes("melody");
  return { type, stereo, melody };
};

export const MusicgenModelSelector = ({
  musicgenParams,
  setMusicgenParams,
}: {
  musicgenParams: MusicgenParams;
  setMusicgenParams: React.Dispatch<React.SetStateAction<MusicgenParams>>;
}) => {
  const {
    type: modelType,
    stereo,
    melody,
  } = decomputeModel(musicgenParams.model);

  const { stereo: stereoAvailable, melody: melodyAvailable } =
    modelMap[modelType];

  return (
    <div className="flex flex-col border border-gray-300 p-2 rounded text-md">
      <div className="text-md">Model:</div>
      <div className="flex gap-2">
        <label className="text-md">Size:</label>
        <div className="flex gap-x-2">
          {["Small", "Medium", "Large", "Audiogen"].map((model) => (
            <div key={model} className="flex items-center">
              <input
                type="radio"
                name="size"
                id={model}
                value={model}
                checked={modelType === model}
                onChange={(event) => {
                  const newModel = event.target.value;
                  setMusicgenParams({
                    ...musicgenParams,
                    model: computeModel(newModel, stereo, melody),
                  });
                }}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="ml-1 select-none" htmlFor={model}>
                {model}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <label className="text-md">Stereo:</label>
        <input
          type="checkbox"
          name="stereo"
          checked={stereo}
          onChange={() => {
            setMusicgenParams({
              ...musicgenParams,
              model: computeModel(modelType, !stereo, melody),
            });
          }}
          className="border border-gray-300 p-2 rounded"
          disabled={!stereoAvailable}
        />
        <label className="text-md">Use Melody:</label>
        <input
          type="checkbox"
          name="melody"
          checked={melody}
          onChange={() => {
            setMusicgenParams({
              ...musicgenParams,
              model: computeModel(modelType, stereo, !melody),
            });
          }}
          className="border border-gray-300 p-2 rounded"
          disabled={!melodyAvailable}
        />
      </div>
    </div>
  );
};
