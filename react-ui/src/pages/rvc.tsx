import Head from "next/head";
import React from "react";
import { AudioOutput } from "../components/AudioComponents";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { useRVCGenerationParams } from "../tabs/RVCParams";
import { RVCInputs } from "../components/RVCInputs";
import { applyRVC } from "../functions/applyRVC";
import { RVCResult } from "../tabs/RVCResult";
import { parseFormChange } from "../data/parseFormChange";

const initialHistory = []; // prevent infinite loop
const RvcGenerationPage = () => {
  const [historyData, setHistoryData] = useLocalStorage<RVCResult[]>(
    "rvcGenerationHistory",
    initialHistory
  );
  const [data, setData] = useLocalStorage<RVCResult | null>(
    "rvcGenerationOutput",
    null
  );
  const [rvcGenerationParams, setRvcGenerationParams] =
    useRVCGenerationParams();
  const [loading, setLoading] = React.useState<boolean>(false);

  async function rvcGeneration() {
    setLoading(true);
    const result = await applyRVC(rvcGenerationParams);
    setData(result);
    setHistoryData((historyData) => [result, ...historyData]);
    setLoading(false);
  }

  // const favorite = async (_url: string, data?: Result) => {
  //   const history_bundle_name_data = data?.bundle_name;
  //   if (!history_bundle_name_data) return;
  //   const response = await fetch("/api/gradio/bark_favorite", {
  //     method: "POST",
  //     body: JSON.stringify({
  //       history_bundle_name_data,
  //     }),
  //   });
  //   const result = await response.json();
  //   console.log(result);
  // };

  const useParameters = (_url: string, data?: RVCResult) => {
    const {
      f0up_key: pitch_up_key,
      index_path: index,
      f0method: pitch_collection_method,
      model_path: model,
      index_rate: search_feature_ratio,
      device,
      is_half: use_half_precision_model,
      filter_radius: filter_radius_pitch,
      resample_sr: resample_sample_rate,
      rms_mix_rate: voice_envelope_normalizaiton,
      protect: protect_breath_sounds,
    } = data?.metadata ?? {};

    setRvcGenerationParams({
      ...rvcGenerationParams,
      pitch_up_key: pitch_up_key ?? rvcGenerationParams.pitch_up_key,
      // original_audio,
      index: index ?? rvcGenerationParams.index,
      pitch_collection_method:
        pitch_collection_method ?? rvcGenerationParams.pitch_collection_method,
      model: model ?? rvcGenerationParams.model,
      search_feature_ratio:
        search_feature_ratio ?? rvcGenerationParams.search_feature_ratio,
      device: device ?? rvcGenerationParams.device,
      use_half_precision_model:
        use_half_precision_model ??
        rvcGenerationParams.use_half_precision_model,
      filter_radius_pitch:
        filter_radius_pitch ?? rvcGenerationParams.filter_radius_pitch,
      resample_sample_rate:
        resample_sample_rate ??
        rvcGenerationParams.resample_sample_rate,
      voice_envelope_normalizaiton:
        voice_envelope_normalizaiton ??
        rvcGenerationParams.voice_envelope_normalizaiton,
      protect_breath_sounds:
        protect_breath_sounds ?? rvcGenerationParams.protect_breath_sounds,
    });
  };

  const funcs = {
    // favorite,
    useParameters,
  };

  const handleChange = parseFormChange(setRvcGenerationParams);

  return (
    <Template>
      <Head>
        <title>RVC - TTS Generation Webui</title>
      </Head>
      <div className="flex w-full flex-col">
        <RVCInputs
          rvcParams={rvcGenerationParams}
          handleChange={handleChange}
        />
        <div className="flex flex-col space-y-4">
          <button
            className="border border-gray-300 p-2 rounded hover:bg-gray-100"
            onClick={rvcGeneration}
          >
            {loading ? "Converting..." : "Convert"}
          </button>
          <AudioOutput
            audioOutput={data?.audio}
            label="Rvc Output"
            funcs={funcs}
            metadata={data}
            filter={["sendToRvc", "sendToRvcVoiceGeneration"]}
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
                  // label={item.}
                  label={`History ${index}`}
                  funcs={funcs}
                  metadata={item}
                  filter={["sendToRvc", "sendToRvcVoiceGeneration"]}
                />
              ))}
          </div>
        </div>
      </div>
      {/* <pre>{JSON.stringify(rvcGenerationParams, null, 2)}</pre> */}
    </Template>
  );
};

export default RvcGenerationPage;
