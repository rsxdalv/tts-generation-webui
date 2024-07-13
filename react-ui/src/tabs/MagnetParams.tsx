import useLocalStorage, {
  updateLocalStorageWithFunction,
} from "../hooks/useLocalStorage";
import router from "next/router";
import { GradioFile } from "../types/GradioFile";

export const magnetId = "magnetParams";

export type MagnetParams = {
  model: string;
  text: string;
  seed: number;
  use_sampling: boolean;
  top_k: number;
  top_p: number;
  temperature: number;
  max_cfg_coef: number;
  min_cfg_coef: number;
  decoding_steps_1: number;
  decoding_steps_2: number;
  decoding_steps_3: number;
  decoding_steps_4: number;
  span_arrangement: string;
};

export const initialMagnetParams: MagnetParams = {
  model: "facebook/magnet-small-10secs",
  text: "",
  seed: 0,
  use_sampling: true,
  top_k: 0,
  top_p: 0.9,
  temperature: 1,
  max_cfg_coef: 20.0,
  min_cfg_coef: 1.0,
  decoding_steps_1: 80,
  decoding_steps_2: 40,
  decoding_steps_3: 40,
  decoding_steps_4: 40,
  span_arrangement: "nonoverlap",
};

export type MagnetResult = {
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
    model: string;
    text: string;
    seed: string;
    use_sampling: boolean;
    top_k: number;
    top_p: number;
    temperature: number;
    max_cfg_coef: number;
    min_cfg_coef: number;
    decoding_steps: number[];
    span_arrangement: string;
  };
};

export const sendToMagnet = (melody?: string) => {
  if (!melody) return;
  updateLocalStorageWithFunction(
    magnetId,
    (magnetParams: MagnetParams = initialMagnetParams) =>
      ({ ...magnetParams, melody } as MagnetParams)
  );
  router.push("/magnet");
};

export const useMagnetParams = () =>
  useLocalStorage<MagnetParams>(magnetId, initialMagnetParams);

export const useMagnetResult = () =>
  useLocalStorage<MagnetResult | null>(magnetId + ".output", null);
