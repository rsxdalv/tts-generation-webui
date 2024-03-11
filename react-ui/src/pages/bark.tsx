import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import {
  BarkGenerationParams,
  barkGenerationId,
  initialState,
} from "../tabs/BarkGenerationParams";
import { BarkResult } from "../tabs/BarkResult";
import { BarkInputs } from "../components/BarkInputs";
import { getBarkFuncs } from "../data/getBarkFuncs";

const initialHistory = []; // prevent infinite loop
const BarkGenerationPage = () => {
  const [historyData, setHistoryData] = useLocalStorage<BarkResult[]>(
    "barkGenerationHistory",
    initialHistory
  );
  const [data, setData] = useLocalStorage<BarkResult | null>(
    "barkGenerationOutput",
    null
  );
  const [barkGenerationParams, setBarkVoiceGenerationParams] =
    useLocalStorage<BarkGenerationParams>(barkGenerationId, initialState);
  const [loading, setLoading] = React.useState<boolean>(false);

  async function bark() {
    setLoading(true);
    const result = await barkGenerate(barkGenerationParams);
    setData(result);
    setHistoryData((historyData) => [result, ...historyData]);
    setLoading(false);
  }

  const funcs = getBarkFuncs(
    setBarkVoiceGenerationParams,
    barkGenerationParams
  );

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    setBarkVoiceGenerationParams({
      ...barkGenerationParams,
      [name]:
        type === "number" || type === "range"
          ? Number(value)
          : type === "checkbox"
          ? (event.target as HTMLInputElement).checked // type assertion
          : value,
    });
  };

  return (
    <Template>
      <Head>
        <title>Bark - TTS Generation Webui</title>
      </Head>
      <div className="flex w-full flex-col">
        <BarkInputs
          barkGenerationParams={barkGenerationParams}
          setBarkVoiceGenerationParams={setBarkVoiceGenerationParams}
          handleChange={handleChange}
          data={data}
        />
        <div className="flex flex-col space-y-4">
          <button
            className="border border-gray-300 p-2 rounded hover:bg-gray-100"
            onClick={bark}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
          <AudioOutput
            audioOutput={data?.audio}
            label="Bark Output"
            funcs={funcs}
            metadata={data}
            filter={["sendToBark", "sendToBarkVoiceGeneration"]}
          />
        </div>
        <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
          <label className="text-sm">History:</label>
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={() => {
              setHistoryData([]);
            }}
          >
            Clear History
          </button>
          <div className="flex flex-col space-y-2">
            {historyData &&
              historyData.map((item, index) => (
                <AudioOutput
                  key={index}
                  audioOutput={item.audio}
                  label={item.history_bundle_name_data}
                  funcs={funcs}
                  metadata={item}
                  filter={["sendToBark", "sendToBarkVoiceGeneration"]}
                />
              ))}
          </div>
        </div>
      </div>
      {/* <pre>{JSON.stringify(barkGenerationParams, null, 2)}</pre> */}
    </Template>
  );
};

export default BarkGenerationPage;

async function barkGenerate(barkGenerationParams: BarkGenerationParams) {
  const response = await fetch("/api/gradio/bark", {
    method: "POST",
    body: JSON.stringify(barkGenerationParams),
  });

  return await response.json();
}
