import React from "react";
import { Template } from "../components/Template";
import Head from "next/head";

type GPUInfo = {
  vram: number;
  name: string;
  cuda_capabilities: number[];
  used_vram: number;
  used_vram_total: number;
};

const GPUInfoWidget = ({}) => {
  const [gpuData, setGPUData] = React.useState<GPUInfo>({
    vram: 0,
    name: "",
    cuda_capabilities: [],
    used_vram: 0,
    used_vram_total: 0,
  });
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchGPUData = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/get_gpu_info", {
      method: "POST",
    });

    const result = await response.json();
    setGPUData(result);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchGPUData();
    const interval = setInterval(fetchGPUData, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-3/4">
      <h2 className="text-lg">
        {gpuData.name} [{gpuData.vram} MB]
      </h2>
      <h3>Compute Capability: {gpuData.cuda_capabilities.join(".")}</h3>
      <div className="flex items-center">
        <p className="text-sm w-36">Used VRAM Webui [{gpuData.used_vram.toFixed(0)} MB]:</p>
        <div className="flex w-2/3">
          <div
            style={{
              width: `${(gpuData.used_vram / gpuData.vram) * 100}%`,
              height: "10px",
            }}
            className="bg-orange-400"
          ></div>
          <div
            style={{
              width: `${(1 - gpuData.used_vram / gpuData.vram) * 100}%`,
              height: "10px",
            }}
            className="bg-slate-300"
          ></div>
        </div>
      </div>
      <div className="flex items-center">
        <p className="text-sm w-36">Used VRAM Total [{gpuData.used_vram_total.toFixed(0)} MB]:</p>
        <div className="flex w-2/3">
          <div
            style={{
              width: `${(gpuData.used_vram_total / gpuData.vram) * 100}%`,
              height: "10px",
            }}
            className="bg-orange-400"
          ></div>
          <div
            style={{
              width: `${(1 - gpuData.used_vram_total / gpuData.vram) * 100}%`,
              height: "10px",
            }}
            className="bg-slate-300"
          ></div>
        </div>
      </div>
    </div>
  );
};

const GPUInfoPage = () => {
  return (
    <Template>
      <Head>
        <title>Magnet - TTS Generation Webui</title>
      </Head>
      <div className="gap-y-4 p-4 flex w-full flex-col items-center">
        <GPUInfoWidget />
      </div>
    </Template>
  );
};

export default GPUInfoPage;
