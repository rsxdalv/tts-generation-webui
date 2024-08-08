import useLocalStorage, {
  readLocalStorage,
  updateLocalStorageWithFunction,
} from "../hooks/useLocalStorage";
import router from "next/router";
import { GradioFile } from "../types/GradioFile";

const mahaId = "mahaParams";

export type MahaParams = {
  text: string;
  model_language: string;
  maha_tts_language: string;
  speaker_name: string;
  seed: number;
  device: string;
  use_random_seed: boolean;
};

export const initialMahaParams: MahaParams = {
  text: "",
  model_language: "Smolie-in",
  maha_tts_language: "english",
  speaker_name: "",
  seed: 0,
  device: "auto",
  use_random_seed: true,
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

export const getMahaParams = (): MahaParams =>
  readLocalStorage(mahaId) ?? initialMahaParams;
