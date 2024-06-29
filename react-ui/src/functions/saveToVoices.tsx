export const saveToVoices = (api_filename?: string) => {
  fetch("/api/gradio/save_to_voices", {
    method: "POST",
    body: JSON.stringify({
      history_npz: api_filename?.replace(".ogg", ".npz"),
    }),
  });
};
