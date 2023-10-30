import { updateLocalStorageWithFunction } from "../hooks/useLocalStorage";
import router from "next/router";

export type VocosParamsNPZ = {
  npz_file?: string;
};

export const initialState: VocosParamsNPZ = {
  npz_file: "https://www.mfiles.co.uk/mp3-downloads/gs-cd-track2.mp3",
};

export const vocosIdNPZ = "vocos_npz-tab";

export const sendToVocosNPZ = (audio?: string) => {
  if (!audio) return;
  updateLocalStorageWithFunction(
    vocosIdNPZ,
    (vocosParams: VocosParamsNPZ = initialState) =>
      ({ ...vocosParams, npz_file: audio } as VocosParamsNPZ)
  );
  router.push("/vocos_wav");
};
