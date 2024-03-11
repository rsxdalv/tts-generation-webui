import { BarkResult } from "../tabs/BarkResult";

export const barkFavorite = async (_url: string, data?: BarkResult) => {
  const history_bundle_name_data = data?.history_bundle_name_data;
  if (!history_bundle_name_data) return;

  const response = await fetch("/api/gradio/bark_favorite", {
    method: "POST",
    body: JSON.stringify({
      history_bundle_name_data,
    }),
  });

  return await response.json();
};
