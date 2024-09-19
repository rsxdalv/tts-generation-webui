import React from "react";
import { GPUMemoryUsage } from "./component/GPUMemoryUsage";
import { GPUInfo } from "../types/GPUInfo";
import { GPUMeta } from "./component/GPUMeta";
import { cn } from "../lib/utils";

export const GPUInfoWidget = ({ className = "", refreshInterval = 2000 }) => {
  const [gpuDatas, setGPUDatas] = React.useState<GPUInfo[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchGPUData = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/get_gpu_info", {
      method: "POST",
    });

    const result = await response.json();
    setGPUDatas(result);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchGPUData();
    const interval = setInterval(fetchGPUData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading && !gpuDatas.length) {
    return <div>Loading GPU info...</div>;
  }

  return (
    <div className={cn("flex gap-2 w-3/4", className)}>
      {gpuDatas.map((gpuData) => (
        <>
          <GPUMeta {...gpuData} />
          <GPUMemoryUsage {...gpuData} />
        </>
      ))}
    </div>
  );
};
