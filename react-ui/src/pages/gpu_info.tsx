import React from "react";
import { Template } from "../components/Template";
import Head from "next/head";

type GPUInfo = {
  vram: number;
  name: string;
  cuda_capabilities: number[];
  used_vram: number;
  used_vram_total: number;
  cached_vram: number;
  torch_version: string;
};

const REFRESH_RATE = 500;

const ProgressBar = ({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) => {
  const percentage = (value / total) * 100;
  return (
    <div className="flex items-center">
      <p className="text-sm w-36">
        {label}: <br />
        [{value.toFixed(0)} MB]
      </p>
      <div className="flex w-2/3">
        <div
          style={{
            width: `${percentage}%`,
            height: "10px",
          }}
          className="bg-orange-400"
        ></div>
        <div
          style={{
            width: `${100 - percentage}%`,
            height: "10px",
          }}
          className="bg-slate-300"
        ></div>
      </div>
    </div>
  );
};

const GPUInfoWidget = ({}) => {
  const [gpuData, setGPUData] = React.useState<GPUInfo>({
    vram: 0,
    name: "",
    cuda_capabilities: [],
    used_vram: 0,
    used_vram_total: 0,
    cached_vram: 0,
    torch_version: "",
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
    const interval = setInterval(fetchGPUData, REFRESH_RATE);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-3/4">
      <h2 className="text-lg">
        {gpuData.name} [{Math.round(gpuData.vram / 1024)} GB]
      </h2>
      <h3>Compute Capability: {gpuData.cuda_capabilities.join(".")}</h3>
      <h3>PyTorch Version: {gpuData.torch_version}</h3>
      <ProgressBar
        label="Used VRAM"
        value={gpuData.used_vram}
        total={gpuData.vram}
      />
      <ProgressBar
        label="Cached VRAM"
        value={gpuData.cached_vram}
        total={gpuData.vram}
      />
      <ProgressBar
        label="Used VRAM System"
        value={gpuData.used_vram_total}
        total={gpuData.vram}
      />
    </div>
  );
};

const GPUInfoPage = () => {
  return (
    <Template>
      <Head>
        <title>GPU Info - TTS Generation Webui</title>
      </Head>
      <div className="gap-y-4 p-4 flex w-full flex-col items-center">
        <GPUInfoWidget />
      </div>
    </Template>
  );
};

export default GPUInfoPage;
