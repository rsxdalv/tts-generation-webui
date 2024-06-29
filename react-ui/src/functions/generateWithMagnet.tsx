import {
  MagnetParams,
  MagnetResult
} from "../tabs/MagnetParams";

export async function generateWithMagnet(magnetParams: MagnetParams) {
  const body = JSON.stringify({ ...magnetParams });
  const response = await fetch("/api/gradio/magnet", {
    method: "POST",
    body,
  });

  return (await response.json()) as MagnetResult;
}
