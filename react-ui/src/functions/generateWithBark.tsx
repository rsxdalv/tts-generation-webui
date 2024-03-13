import { BarkGenerationParams } from "../tabs/BarkGenerationParams";
import { BarkResult } from "../tabs/BarkResult";

export async function generateWithBark(barkGenerationParams: BarkGenerationParams) {
  const response = await fetch("/api/gradio/bark", {
    method: "POST",
    body: JSON.stringify(barkGenerationParams),
  });

  return (await response.json()) as BarkResult;
}
