import { GradioFile } from "../types/GradioFile";

export type BarkResult = {
  audio: GradioFile;
  image: string;
  save_button: Object;
  continue_button: Object;
  buttons_row: Object;
  npz: string;
  seed: null;
  json_text: {
    _version: string;
    _hash_version: string;
    _type: string;
    is_big_semantic_model: boolean;
    is_big_coarse_model: boolean;
    is_big_fine_model: boolean;
    prompt: string;
    language: string;
    speaker_id: string;
    hash: string;
    history_prompt: string;
    history_prompt_npz: string;
    history_hash: string;
    text_temp: number;
    waveform_temp: number;
    date: string;
    seed: string;
    semantic_prompt: string;
    coarse_prompt: string;
  };
  history_bundle_name_data: string;
};
