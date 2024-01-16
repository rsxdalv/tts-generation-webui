import { updateLocalStorageWithFunction } from "../hooks/useLocalStorage";
import router from "next/router";

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
  top_p: 0.8,
  temperature: 3.5,
  max_cfg_coef: 20.0,
  min_cfg_coef: 1.0,
  decoding_steps_1: 20,
  decoding_steps_2: 10,
  decoding_steps_3: 10,
  decoding_steps_4: 10,
  span_arrangement: "nonoverlap",
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
