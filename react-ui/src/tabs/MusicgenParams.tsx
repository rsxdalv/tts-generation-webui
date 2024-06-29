import useLocalStorage, {
  updateLocalStorageWithFunction,
} from "../hooks/useLocalStorage";
import router from "next/router";
import { GradioFile } from "../types/GradioFile";

export const musicgenId = "musicgenParams";

export type MusicgenParams = {
  text: string;
  melody?: string;
  model: string;
  duration: number;
  topk: number;
  topp: number;
  temperature: number;
  cfg_coef: number;
  seed: number;
  use_multi_band_diffusion: boolean;
};

export const initialMusicgenParams: MusicgenParams = {
  // text: "",
  text: "lofi hip hop beats to relax/study to",
  melody: undefined,
  // melody: "https://www.mfiles.co.uk/mp3-downloads/gs-cd-track2.mp3",
  model: "facebook/musicgen-small",
  duration: 1,
  topk: 250,
  topp: 0,
  temperature: 1.0,
  cfg_coef: 3.0,
  seed: -1,
  use_multi_band_diffusion: false,
};

export type MusicgenResult = {
  audio: GradioFile;
  history_bundle_name_data: string;
  json: {
    _version: string;
    _hash_version: string;
    _type: string;
    _audiocraft_version: string;
    models: {};
    prompt: string;
    hash: string;
    date: string;
    melody?: any;
    text: string;
    model: string;
    duration: number;
    topk: number;
    topp: number;
    temperature: number;
    cfg_coef: number;
    seed: string;
    use_multi_band_diffusion: boolean;
  };
};

export const sendToMusicgen = (melody?: string) => {
  if (!melody) return;
  updateLocalStorageWithFunction(
    musicgenId,
    (musicgenParams: MusicgenParams = initialMusicgenParams) =>
      ({ ...musicgenParams, melody } as MusicgenParams)
  );
  router.push("/musicgen");
};

export const useMusicgenParams = () =>
  useLocalStorage<MusicgenParams>(musicgenId, initialMusicgenParams);

export const useMusicgenResult = () =>
  useLocalStorage<MusicgenResult | null>(musicgenId + ".output", null);
