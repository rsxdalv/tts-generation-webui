import React from "react";
import { GPUMemoryUsage } from "./component/GPUMemoryUsage";
import { GPUInfo } from "../types/GPUInfo";
import { GPUMeta } from "./component/GPUMeta";

const REFRESH_INTERVAL = 2000;

export const GPUInfoWidget = ({}) => {
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
    const interval = setInterval(fetchGPUData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (loading && !gpuDatas.length) {
    return <div>Loading GPU info...</div>;
  }

  return (
    <div className="flex gap-2 w-3/4">
      {gpuDatas.map((gpuData) => (
        <>
          <GPUMeta {...gpuData} />
          <GPUMemoryUsage {...gpuData} />
        </>
      ))}
    </div>
  );
};
