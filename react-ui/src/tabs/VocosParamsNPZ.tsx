import { updateLocalStorageWithFunction } from "../hooks/useLocalStorage";
import router from "next/router";

export type EncodecParamsNPZ = {
  npz_file?: string;
};

export const initialState: EncodecParamsNPZ = {
  npz_file: "https://www.mfiles.co.uk/mp3-downloads/gs-cd-track2.mp3",
};

export const vocosIdNPZ = "vocos_npz-tab";

export const sendToVocosNPZ = (npz_file?: string) => {
  if (!npz_file) return;
  updateLocalStorageWithFunction(
    vocosIdNPZ,
    (vocosParams: EncodecParamsNPZ = initialState) =>
      ({ ...vocosParams, npz_file } as EncodecParamsNPZ)
  );
  router.push("/vocos_npz");
};
