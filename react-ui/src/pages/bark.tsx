import React from "react";
import { Template } from "../components/Template";
import { AudioOutput } from "../components/AudioComponents";
import { BarkInputs } from "../components/BarkInputs";
import { useBarkPage } from "../tabs/BarkGenerationParams";
import { GenerationHistorySimple } from "../components/GenerationHistory";
import { HyperParameters } from "../components/HyperParameters";

const BarkGenerationPage = () => {
  const {
    barkGenerationParams,
    historyData,
    setHistoryData,
    handleChange,
    consumer,
    funcs,
  } = useBarkPage();

  return (
    <Template title="Bark">
      <div className="flex w-full flex-col">
        <BarkInputs
          barkGenerationParams={barkGenerationParams}
          handleChange={handleChange}
        />
        <div className="flex flex-col space-y-4">
          <AudioOutput
            audioOutput={historyData[0]?.audio}
            label="Bark Output"
            funcs={funcs}
            metadata={historyData[0]}
            filter={["sendToBark", "sendToBarkVoiceGeneration"]}
          />
          <HyperParameters
            genParams={barkGenerationParams}
            consumer={consumer}
            prefix="bark"
          />
        </div>

        <GenerationHistorySimple
          name="bark"
          setHistoryData={setHistoryData}
          historyData={historyData}
          funcs={funcs}
          nameKey="history_bundle_name_data"
          filter={["sendToBark", "sendToBarkVoiceGeneration"]}
        />
      </div>
    </Template>
  );
};

export default BarkGenerationPage;
