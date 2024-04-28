import { MahaParams, MahaResult } from "../tabs/MahaParams";

export async function generateWithMaha(mahaParams: MahaParams) {
  const body = JSON.stringify({ ...mahaParams });
  const response = await fetch("/api/gradio/maha", {
    method: "POST",
    body,
  });

  return (await response.json()) as MahaResult;
}
