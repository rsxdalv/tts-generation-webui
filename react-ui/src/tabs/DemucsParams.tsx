import { updateLocalStorageWithFunction } from "../hooks/useLocalStorage";
import router from "next/router";

export type DemucsParams = {
  file?: string;
};

export const initialState: DemucsParams = {
  file: "https://www.mfiles.co.uk/mp3-downloads/gs-cd-track2.mp3",
};

export const demucsId = "demucs-tab";

export const sendToDemucs = (file?: string) => {
  if (!file) return;
  updateLocalStorageWithFunction(
    demucsId,
    (demucsParams: DemucsParams = initialState) =>
      ({ ...demucsParams, file } as DemucsParams)
  );
  router.push("/demucs");
};
