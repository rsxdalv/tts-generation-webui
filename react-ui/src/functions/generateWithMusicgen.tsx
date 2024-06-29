import {
  MusicgenParams,
  MusicgenResult
} from "../tabs/MusicgenParams";

export async function generateWithMusicgen(musicgenParams: MusicgenParams) {
  const body = JSON.stringify({
    ...musicgenParams,
    melody: musicgenParams.model.includes("melody")
      ? musicgenParams.melody
      : null,
    model: musicgenParams.model,
  });
  const response = await fetch("/api/gradio/musicgen", {
    method: "POST",
    body,
  });

  return (await response.json()) as MusicgenResult;
}
