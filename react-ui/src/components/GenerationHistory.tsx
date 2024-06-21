import React from "react";
import { AudioOutput } from "./AudioComponents";
import useLocalStorage from "../hooks/useLocalStorage";

export const GenerationHistorySimple = ({
  setHistoryData,
  name,
  ...props
}: {
  setHistoryData: React.Dispatch<React.SetStateAction<any[]>>;
  name: string;
  // pass through props
  historyData: any[];
  funcs?: Record<string, (audio: string | undefined | any) => void>;
  nameKey?: string;
  filter?: string[];
}) => {
  const [showLast, setShowLast] = useLocalStorage<number>(
    name + "ShowLast",
    10
  );

  return (
    <GenerationHistory
      clearHistory={() => setHistoryData([])}
      showLast={showLast}
      setShowLast={setShowLast}
      {...props}
    />
  );
};

export const GenerationHistory = ({
  clearHistory,
  showLast,
  setShowLast,
  historyData,
  funcs,
  nameKey,
  filter,
}: {
  clearHistory: () => void;
  showLast: number;
  setShowLast: React.Dispatch<React.SetStateAction<number>>;
  historyData: any[];
  funcs?: Record<string, (audio: string | undefined | any) => void>;
  nameKey?: string;
  filter?: string[];
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
        historyData
          .slice(1, showLast + 1)
          .map((item, index) => (
            <AudioOutput
              key={index}
              audioOutput={item.audio}
              metadata={item}
              label={nameKey ? item[nameKey] : `History ${index}`}
              funcs={funcs}
              filter={filter}
            />
          ))}
    </div>
  </div>
);
