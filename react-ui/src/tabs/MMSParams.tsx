import useLocalStorage, {
  updateLocalStorageWithFunction,
} from "../hooks/useLocalStorage";
import router from "next/router";
import { GradioFile } from "../types/GradioFile";

const MMS_ID = "MMSParams";

export type MMSParams = {
  text: string;
  language: string;
  speaking_rate: number;
  noise_scale: number;
  noise_scale_duration: number;
};

export const initialMMSParams: MMSParams = {
  text: "",
  language: "eng",
  speaking_rate: 1.0,
  noise_scale: 0.667,
  noise_scale_duration: 0.8,
};

export type MMSResult = {
  audio: GradioFile;
  metadata: {
    _version: string;
    _hash_version: string;
    _type: string;
    text: string;
    language: string;
    speaking_rate: number;
    noise_scale: number;
    noise_scale_duration: number;
  };
};

export const sendToMMS = (melody?: string) => {
  if (!melody) return;
  updateLocalStorageWithFunction(
    MMS_ID,
    (MMSParams: MMSParams = initialMMSParams) =>
      ({ ...MMSParams, melody } as MMSParams)
  );
  router.push("/MMS");
};

export const useMMSParams = () =>
  useLocalStorage<MMSParams>(MMS_ID, initialMMSParams);

export const useMMSResult = () =>
  useLocalStorage<MMSResult | null>(MMS_ID + ".output", null);
