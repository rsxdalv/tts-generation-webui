import React from "react";
import { ProgressBar } from "./ProgressBar";

type GPUInfo = {
  vram: number;
  name: string;
  cuda_capabilities: number[];
  used_vram: number;
  used_vram_total: number;
  cached_vram: number;
  torch_version: string;
};

const REFRESH_RATE = 2000;

export const GPUInfoWidget = ({}) => {
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

  if (loading && !gpuData.name) {
    return <div>Loading GPU info...</div>;
  }

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
