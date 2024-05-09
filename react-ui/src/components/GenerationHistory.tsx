import React from "react";
import { AudioOutput } from "./AudioComponents";

export const GenerationHistory = ({
  clearHistory,
  showLast,
  setShowLast,
  historyData,
  funcs,
}: {
  clearHistory: () => void;
  showLast: number;
  setShowLast: React.Dispatch<React.SetStateAction<number>>;
  historyData: any[];
  funcs?: Record<string, (audio: string | undefined | any) => void>;
}) => (
  <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded">
    <div className="flex gap-x-2">
      <label className="text-md mr-auto">History</label>
      <button
        className="border border-gray-300 py-2 px-12 rounded"
        onClick={clearHistory}
      >
        Clear History
      </button>
      <div className="flex gap-x-2 items-center">
        <label className="text-sm">Show Last X entries:</label>
        <input
          type="number"
          value={showLast}
          onChange={(event) => setShowLast(Number(event.target.value))}
          className="border border-gray-300 p-2 rounded"
          min="0"
          max="100"
          step="1"
        />
      </div>
    </div>
    <div className="flex flex-col gap-y-2">
      {historyData &&
        historyData.slice(1, showLast + 1).map((item, index) => (
          <AudioOutput
            key={index}
            audioOutput={item.audio}
            metadata={item}
            //   label={item.history_bundle_name_data}
            label={`History ${index}`}
            funcs={funcs}
            filter={["sendToMusicgen"]}
          />
        ))}
    </div>
  </div>
);
