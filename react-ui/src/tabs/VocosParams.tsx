import { updateLocalStorageWithFunction } from "../hooks/useLocalStorage";
import router from "next/router";

export type VocosParams = {
  audio?: string;
  bandwidth?: string;
};

export const initialState: VocosParams = {
  audio: "https://www.mfiles.co.uk/mp3-downloads/gs-cd-track2.mp3",
  bandwidth: "1.5",
};

export const vocosId = "vocos_wav-tab";

export const sendToVocos = (audio?: string) => {
  if (!audio) return;
  updateLocalStorageWithFunction(
    vocosId,
    (vocosParams: VocosParams = initialState) =>
      ({ ...vocosParams, audio } as VocosParams)
  );
  router.push("/vocos_wav");
};
