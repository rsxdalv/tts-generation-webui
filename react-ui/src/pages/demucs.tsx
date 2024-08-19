import React from "react";
import { Template } from "../components/Template";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import { useDemucsPage } from "../tabs/DemucsParams";
import { GenerationHistorySimple } from "../components/GenerationHistory";

const DemucsPage = () => {
  const {
    demucsParams,
    setDemucsParams,
    historyData,
    setHistoryData,
    consumer: demucs,
    funcs,
  } = useDemucsPage();

  return (
    <Template title="Demucs">
      <div className="flex flex-col space-y-4">
        <div className="flex space-x-4">
          <div className="flex flex-col space-y-2">
            <AudioInput
              url={demucsParams?.file}
              callback={(file) => {
                if (!file) return;
                setDemucsParams({
                  ...demucsParams,
                  file,
                });
              }}
              filter={["sendToDemucs"]}
            />

            <button
              className="border border-gray-300 p-2 rounded"
              onClick={() => demucs(demucsParams)}
            >
              Split with Demucs
            </button>
          </div>
          <div className="flex flex-col space-y-4">
            {historyData.slice(0, 4).map(({ audio, typeName }) => (
              <AudioOutput
                key={typeName}
                audioOutput={audio}
                label={typeName}
                funcs={funcs}
                filter={["sendToDemucs"]}
              />
            ))}
          </div>
        </div>

        <GenerationHistorySimple
          name="demucs"
          setHistoryData={setHistoryData}
          historyData={historyData.slice(3)}
          funcs={funcs}
          nameKey="typeName"
          filter={["sendToDemucs"]}
        />
      </div>
    </Template>
  );
};

export default DemucsPage;
