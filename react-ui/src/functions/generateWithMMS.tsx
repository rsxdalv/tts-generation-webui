import { MMSParams, MMSResult } from "../tabs/MMSParams";

export async function generateWithMMS(mmsParams: MMSParams) {
  const body = JSON.stringify({ ...mmsParams });
  const response = await fetch("/api/gradio/mms", {
    method: "POST",
    body,
  });

  return (await response.json()) as MMSResult;
}
