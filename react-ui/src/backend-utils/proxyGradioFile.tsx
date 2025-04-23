import { defaultBackend } from "@/backend-utils/defaultBackend";

export const proxyGradioFile = (data: any) => {
  if (typeof data !== "object") return data;
  if (typeof data.url !== "string") return data;

  // Handle standard backend URLs
  if (data.url.startsWith(defaultBackend)) {
    return {
      ...data,
      url: data.url.replace(defaultBackend, "/api/gradio-file-proxy/"),
    };
  }
  return data;
};

export const proxyGradioFilesInResult = <T extends any[]>(result: {
  data: T;
}): { data: T } => ({
  ...result,
  data: Array.isArray(result.data)
    ? (result.data.map(proxyGradioFile) as T)
    : // : typeof data === "object"
      //   ? Object.fromEntries(
      //       Object.entries(data).map(([key, value]) => [
      //         key,
      //         proxyGradioFiles(value),
      //       ])
      //     )
      (result.data as T),
});
