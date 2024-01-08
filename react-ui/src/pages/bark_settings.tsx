import React from "react";
import { Template } from "../components/Template";
import Head from "next/head";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  BarkSettingsParams,
  initialBarkSettingsParams,
  barkSettingsId,
} from "../tabs/BarkSettingsParams";

type Result = string;

const BarkSettingsPage = () => {
  const [data, setData] = useLocalStorage<Result | null>(
    "barkSettingsBeacon",
    null
  );
  const [barkSettingsParams, setBarkSettingsParams] =
    useLocalStorage<BarkSettingsParams>(
      barkSettingsId,
      initialBarkSettingsParams
    );

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/gradio/get_config_bark");
        const data = await response.json();
        setBarkSettingsParams((x) => ({ ...x, ...data } as BarkSettingsParams));
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchData();
  }, []);

  const handleChange = async ( 
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;

    const newBarkSettingsParams = {
      ...barkSettingsParams,
      [name]:
        type === "number" || type === "range"
          ? Number(value)
          : type === "checkbox"
          ? (event.target as HTMLInputElement).checked // type assertion
          : value,
    };

    const isConfig =
      name === "text_generation_use_gpu" ||
      name === "text_generation_use_small_model" ||
      name === "coarse_to_fine_inference_use_gpu" ||
      name === "coarse_to_fine_inference_use_small_model" ||
      name === "fine_tuning_use_gpu" ||
      name === "fine_tuning_use_small_model" ||
      name === "use_gpu_codec" ||
      name === "load_models_on_startup";

    const isEnv =
      name === "use_small_models" ||
      name === "enable_mps" ||
      name === "offload_gpu_models_to_cpu";

    if (isConfig) {
      try {
        const response = await fetch("/api/gradio/save_config_bark", {
          method: "POST",
          body: JSON.stringify(newBarkSettingsParams),
        });
        const data = await response.json();
        setBarkSettingsParams(newBarkSettingsParams);
        setData(data);
      } catch (error) {
        console.error("Error:", error);
      }
    }

    if (isEnv) {
      try {
        await fetch(
          "/api/gradio/save_environment_variables_bark",
          {
            method: "POST",
            body: JSON.stringify(newBarkSettingsParams),
          }
        );
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <Template>
      <Head>
        <title>Bark Settings - TTS Generation Webui</title>
      </Head>
      <div className="flex gap-4 mb-auto mt-3">
        <div className="p-4 w-1/2 flex flex-col gap-4">
          <div className="flex border border-gray-300 p-2 rounded gap-2">
            <input
              type="checkbox"
              name="load_models_on_startup"
              checked={barkSettingsParams.load_models_on_startup}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded"
            />
            <label className="text-md">Load Bark models on startup</label>
          </div>
          <div className="flex border border-gray-300 p-2 rounded gap-2">
            <label className="text-md">Text generation:</label>
            <div className="flex space-x-2 items-center ml-auto">
              <input
                type="checkbox"
                name="text_generation_use_gpu"
                checked={barkSettingsParams.text_generation_use_gpu}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="text-sm">Use GPU</label>
            </div>
            <div className="flex space-x-2 items-center">
              <input
                type="checkbox"
                name="text_generation_use_small_model"
                checked={barkSettingsParams.text_generation_use_small_model}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="text-sm">Use small model</label>
            </div>
          </div>
          <div className="flex border border-gray-300 p-2 rounded gap-2">
            <label className="text-md">Coarse-to-fine inference:</label>
            <div className="flex space-x-2 items-center ml-auto">
              <input
                type="checkbox"
                name="coarse_to_fine_inference_use_gpu"
                checked={barkSettingsParams.coarse_to_fine_inference_use_gpu}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="text-sm">Use GPU</label>
            </div>
            <div className="flex space-x-2 items-center">
              <input
                type="checkbox"
                name="coarse_to_fine_inference_use_small_model"
                checked={
                  barkSettingsParams.coarse_to_fine_inference_use_small_model
                }
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="text-sm">Use small model</label>
            </div>
          </div>
          <div className="flex border border-gray-300 p-2 rounded gap-2">
            <label className="text-md">Fine-tuning:</label>
            <div className="flex space-x-2 items-center ml-auto">
              <input
                type="checkbox"
                name="fine_tuning_use_gpu"
                checked={barkSettingsParams.fine_tuning_use_gpu}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="text-sm">Use GPU</label>
            </div>
            <div className="flex space-x-2 items-center">
              <input
                type="checkbox"
                name="fine_tuning_use_small_model"
                checked={barkSettingsParams.fine_tuning_use_small_model}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="text-sm">Use small model</label>
            </div>
          </div>
          <div className="flex border border-gray-300 p-2 rounded gap-2">
            <label className="text-md">Codec:</label>
            <div className="flex space-x-2 items-center ml-auto">
              <input
                type="checkbox"
                name="use_gpu_codec"
                checked={barkSettingsParams.use_gpu_codec}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="text-sm">Use GPU</label>
            </div>
          </div>

          {/* Save Beacon */}
          <div className="flex border border-gray-300 p-2 rounded gap-2">
            {data}
          </div>

          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <div className="flex space-x-2 items-center">
              <label className="text-md">Environment (requires restart):</label>
            </div>
            <div className="flex space-x-2 items-center">
              <input
                type="checkbox"
                name="use_small_models"
                checked={barkSettingsParams.use_small_models}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="text-sm">Use small models</label>
            </div>
            <div className="flex space-x-2 items-center">
              <input
                type="checkbox"
                name="enable_mps"
                checked={barkSettingsParams.enable_mps}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="text-sm">Enable MPS</label>
            </div>
            <div className="flex space-x-2 items-center">
              <input
                type="checkbox"
                name="offload_gpu_models_to_cpu"
                checked={barkSettingsParams.offload_gpu_models_to_cpu}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
              <label className="text-sm">Offload GPU models to CPU</label>
            </div>
          </div>
        </div>
        <div className="p-4">
          Recommended settings:
          <ul>
            <li>For VRAM &gt;= 10GB, use large models.</li>
            <li>For VRAM &lt; 10GB, use small models.</li>
            <ul>
              <li>
                Text generation and coarse-to-fine are of similar importance.
              </li>
              <li>Small models might not have a perceptible difference.</li>
            </ul>
            <li>
              For VRAM &lt; 4GB, use CPU offloading (requires restart).
              <ul>
                <li>Small models are also recommended.</li>
              </ul>
            </li>
            <li>
              For VRAM &lt; 2GB, use CPU offloading and small models (requires
              restart).
            </li>
          </ul>
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={() => {
              setBarkSettingsParams({
                ...barkSettingsParams,
                use_small_models: false,
                enable_mps: false,
                offload_gpu_models_to_cpu: false,
              });
            }}
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </Template>
  );
};

export default BarkSettingsPage;
