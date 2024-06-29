import { VallexParams, VallexResult } from "../tabs/VallexParams";

export async function generateWithVallex(vallexParams: VallexParams) {
  const body = JSON.stringify({ ...vallexParams });
  const response = await fetch("/api/gradio/vall_e_x_generate", {
    method: "POST",
    body,
  });

  return response.json() as Promise<VallexResult>;
}
