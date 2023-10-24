export type Generation = {
  name: string;
  prompt?: string;
  directory: string;
  audio: string;
  tags: string[];
  // deprecated
  download: string;
  language:
    | "american"
    | "german"
    | "spanish"
    | "french"
    | "hindi"
    | "chinese"
    | "portuguese"
    | "russian"
    | "turkish"
    | "polish"
    | "korean"
    | "japanese"
    | "italian";
  author: string;
  gender: "male" | "female" | "other";
  image: string;
};

export interface GenerationRaw {
  prompt: string;
  language: string;
  speaker_id: string;
  history_prompt: string;
  history_prompt_npz: string;
  history_hash: string;
  text_temp: number;
  waveform_temp: number;
  date: string;
  seed: string;
  filename: string;
  filename_png: string;
  filename_json: string;
  filename_npz: string;

  is_big_semantic_model: boolean;
  is_big_coarse_model: boolean;
  is_big_fine_model: boolean;

  hash?: string;
  name?: string;
}
