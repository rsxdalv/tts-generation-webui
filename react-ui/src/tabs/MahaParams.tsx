import useLocalStorage, {
  updateLocalStorageWithFunction,
} from "../hooks/useLocalStorage";
import router from "next/router";
import { GradioFile } from "../types/GradioFile";

export const mahaId = "mahaParams";

export type MahaParams = {
  maha_tts_input: string;
  model_language: string;
  maha_tts_language: string;
  speaker_name: string;
  seed: number;
  device: string;
};

export const initialMahaParams: MahaParams = {
  maha_tts_input: "",
  model_language: "Smolie-in",
  maha_tts_language: "english",
  speaker_name: "",
  seed: -1,
  device: "auto",
};

export type MahaResult = {
  audio: GradioFile;
  metadata: {
    _version: string;
    _hash_version: string;
    _type: string;
    text: string;
    model_language: string;
    text_language: string;
    speaker_name: string;
    seed: string;
  };
};

export const sendToMaha = (melody?: string) => {
  if (!melody) return;
  updateLocalStorageWithFunction(
    mahaId,
    (mahaParams: MahaParams = initialMahaParams) =>
      ({ ...mahaParams, melody } as MahaParams)
  );
  router.push("/maha");
};

export const useMahaParams = () =>
  useLocalStorage<MahaParams>(mahaId, initialMahaParams);

export const useMahaResult = () =>
  useLocalStorage<MahaResult | null>(mahaId + ".output", null);
