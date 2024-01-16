import { client } from "@gradio/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getFile } from "../../../backend-utils/getFile";
import { GradioFile } from "../../../types/GradioFile";
import { join } from "path";

type Data = { data: any };

const defaultBackend = "http://127.0.0.1:7860/";
const getClient = () => client(defaultBackend, {});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { name } = req.query;
  console.log("gradio api handler", name, req.body);

  if (!name || typeof name !== "string" || !endpoints[name]) {
    res.status(404).json({ data: { error: "Not found" } });
    return;
  }

  const { body } = req;
  const parsedBody = body && typeof body === "string" ? JSON.parse(body) : body;
  const result = await endpoints[name](parsedBody);

  res.status(200).json(result);
}

async function demucs({ file }: { file: string }) {
  const audioBlob = await getFile(file);

  const app = await getClient();
  const result = (await app.predict("/demucs", [
    audioBlob, // blob in 'Input' Audio component
  ])) as {
    data: [GradioFile, GradioFile, GradioFile, GradioFile];
  };

  return result?.data;
}

async function vocos_wav({ audio, bandwidth }) {
  const audioBlob = await getFile(audio);

  const app = await getClient();
  const result = (await app.predict("/vocos_wav", [
    audioBlob, // blob in 'Input Audio' Audio component
    bandwidth, // string (Option from: ['1.5', '3.0', '6.0', '12.0']) in 'Bandwidth in kbps' Dropdown component
  ])) as {
    data: [GradioFile];
  };

  return result?.data[0];
}

async function vocos_npz({ npz_file }) {
  const npzBlob = await getFile(npz_file);

  const app = await getClient();
  const result = (await app.predict("/vocos_npz", [
    npzBlob, // blob in 'Input NPZ' File component
  ])) as {
    data: [GradioFile];
  };

  return result?.data[0];
}

async function encodec_decode({ npz_file }) {
  const npzBlob = await getFile(npz_file);

  const app = await getClient();
  const result = (await app.predict("/encodec_decode", [
    npzBlob, // blob in 'Input NPZ' File component
  ])) as {
    data: [GradioFile];
  };

  return result?.data[0];
}

async function musicgen({ melody, ...params }) {
  const melodyBlob = await getFile(melody);

  const app = await getClient();
  const result = (await app.predict("/musicgen", [
    {
      melody: null,
      ...params,
    },
    melodyBlob, // blob in 'Melody (optional)' Audio component
  ])) as {
    data: [
      GradioFile, // output
      string, // history_bundle_name_data
      string, // image
      null, // seed_cache
      Object // result_json
    ];
  };
  const [audio, history_bundle_name_data, , , json] = result?.data;
  return {
    audio,
    history_bundle_name_data,
    json,
  };
}

async function bark_voice_tokenizer_load({ tokenizer, use_gpu }) {
  const app = await getClient();
  const result = (await app.predict("/bark_voice_tokenizer_load", [
    tokenizer, // string (Option from: ['quantifier_hubert_base_ls960.pth @ GitMylo/bark-voice-cloning', 'quantifier_hubert_base_ls960_14.pth @ GitMylo/bark-voice-cloning', 'quantifier_V1_hubert_base_ls960_23.pth @ GitMylo/bark-voice-cloning', 'polish-HuBERT-quantizer_8_epoch.pth @ Hobis/bark-voice-cloning-polish-HuBERT-quantizer', 'german-HuBERT-quantizer_14_epoch.pth @ CountFloyd/bark-voice-cloning-german-HuBERT-quantizer', 'es_tokenizer.pth @ Lancer1408/bark-es-tokenizer', 'portuguese-HuBERT-quantizer_24_epoch.pth @ MadVoyager/bark-voice-cloning-portuguese-HuBERT-quantizer']) in 'Tokenizer' Dropdown component
    use_gpu, // boolean  in 'Use GPU' Checkbox component
  ])) as {
    data: [string];
  };

  return result?.data[0];
}

async function bark_voice_generate({ audio, use_gpu }) {
  const audioBlob = await getFile(audio);

  const app = await getClient();
  const result = (await app.predict("/bark_voice_generate", [
    audioBlob, // blob in 'Input Audio' Audio component
    use_gpu, // boolean  in 'Use GPU' Checkbox component
  ])) as {
    data: [
      string, // string representing output in 'Voice file name' Textbox component
      GradioFile // { name: string; data: string; size?: number; is_file?: boolean; orig_name?: string} representing output in 'Encodec audio preview' Audio component
    ];
  };

  const [filename, preview] = result?.data;
  return { filename, preview };
}

async function bark({
  burn_in_prompt,
  prompt,
  history_setting,
  languageRadio,
  speakerIdRadio,
  useV2,
  text_temp,
  waveform_temp,
  long_prompt_radio,
  long_prompt_history_radio,
  old_generation_dropdown,
  seed_input,
  history_prompt_semantic_dropdown,
}) {
  const app = await getClient();

  const result = (await app.predict("/bark", [
    burn_in_prompt,
    prompt,
    history_setting,
    languageRadio,
    speakerIdRadio,
    useV2,
    text_temp,
    waveform_temp,
    long_prompt_radio,
    long_prompt_history_radio,
    old_generation_dropdown,
    seed_input,
    history_prompt_semantic_dropdown,
  ])) as {
    data: [
      GradioFile, // audio
      string, // image
      Object, // save_button
      Object, // continue_button
      Object, // buttons_row
      null, // npz
      null, // seed
      null, // json_text
      null // history_bundle_name_data
      // note - ignore other 8 rows of data
    ];
  };

  const [
    audio,
    image,
    save_button,
    continue_button,
    buttons_row,
    npz,
    seed,
    json_text,
    history_bundle_name_data,
  ] = result?.data;

  return {
    audio,
    image,
    save_button,
    continue_button,
    buttons_row,
    npz,
    seed,
    json_text,
    history_bundle_name_data,
  };
}

async function reload_old_generation_dropdown() {
  const app = await getClient();

  const result = (await app.predict("/reload_old_generation_dropdown")) as {
    data: [
      {
        choices: string[];
        __type__: "update";
      }
    ];
  };

  return result?.data[0].choices.map(x => x[0]);
}

async function bark_favorite({ history_bundle_name_data }) {
  const app = await getClient();

  const result = (await app.predict("/bark_favorite", [
    history_bundle_name_data,
  ])) as {
    data: [
      Object // save_button
    ];
  };

  return result?.data;
}

async function tortoise({
  prompt,
  speaker,
  preset,
  seed,
  cvvp_amount,
  split_prompt,
  samples,
  diffusion_iterations,
  temperature,
  length_penalty,
  repetition_penalty,
  top_p,
  max_mel_tokens,
  cond_free,
  cond_free_k,
  diffusion_temperature,
  model,
  generation_name,
}) {
  const app = await getClient();

  const result = (await app.predict("/generate_tortoise_1", [
    prompt, // string  in 'Prompt' Textbox component
    speaker, // string (Option from: ['random', 'angie', 'applejack', 'cond_latent_example', 'daniel', 'deniro', 'emma', 'freeman', 'geralt', 'halle', 'jlaw', 'lj', 'mol', 'myself', 'pat', 'pat2', 'rainbow', 'snakes', 'tim_reynolds', 'tom', 'train_atkins', 'train_daws', 'train_dotrice', 'train_dreams', 'train_empire', 'train_grace', 'train_kennard', 'train_lescault', 'train_mouse', 'weaver', 'william', 'freeman_2a', 'freeman_3', 'pat4']) in 'parameter_2502' Dropdown component
    preset, // string (Option from: ['ultra_fast', 'fast', 'standard', 'high_quality']) in 'parameter_2507' Dropdown component
    seed, // number  in 'parameter_2521' Number component
    cvvp_amount, // number (numeric value between 0.0 and 1.0) in 'CVVP Amount' Slider component
    split_prompt, // boolean  in 'Split prompt by lines' Checkbox component
    samples, // number (numeric value between 4 and 256) in 'Samples' Slider component
    diffusion_iterations, // number (numeric value between 4 and 400) in 'Diffusion Iterations' Slider component
    temperature, // number (numeric value between 0.0 and 1.0) in 'Temperature' Slider component
    length_penalty, // number (numeric value between 0.0 and 10.0) in 'Length Penalty' Slider component
    repetition_penalty, // number (numeric value between 0.0 and 10.0) in 'Repetition Penalty' Slider component
    top_p, // number (numeric value between 0.0 and 1.0) in 'Top P' Slider component
    max_mel_tokens, // number (numeric value between 10 and 600) in 'Max Mel Tokens' Slider component
    cond_free, // boolean  in 'Cond Free' Checkbox component
    cond_free_k, // number (numeric value between 0 and 10) in 'Cond Free K' Slider component
    diffusion_temperature, // number (numeric value between 0.0 and 1.0) in 'Temperature' Slider component
    model, // string (Option from: ['Default']) in 'parameter_2488' Dropdown component
    generation_name, // string  in 'Generation Name' Textbox component
  ])) as {
    data: [
      GradioFile, // audio
      string, // image
      Object, // save_button
      string, // seed
      string, // bundle_name
      Object // metadata
    ];
  };

  const [audio, image, save_button, seed2, bundle_name, metadata] =
    result?.data;

  return {
    audio,
    image,
    save_button,
    seed: seed2,
    bundle_name,
    metadata,
  };
}

async function tortoise_refresh_models() {
  const app = await getClient();

  const result = (await app.predict("/tortoise_refresh_models")) as {
    data: [
      {
        choices: string[];
        __type__: "update";
      }
    ];
  };

  return result?.data[0].choices.map(x => x[0])
}

async function tortoise_refresh_voices() {
  const app = await getClient();

  const result = (await app.predict("/tortoise_refresh_voices")) as {
    data: [
      {
        choices: string[];
        __type__: "update";
      }
    ];
  };

  return result?.data[0].choices.map(x => x[0])
}

async function tortoise_open_models() {
  const app = await getClient();

  const result = (await app.predict("/tortoise_open_models")) as {};

  return result;
}

async function tortoise_open_voices() {
  const app = await getClient();

  const result = (await app.predict("/tortoise_open_voices")) as {};

  return result;
}

async function tortoise_apply_model_settings({
  model, // string (Option from: ['Default']) in 'parameter_2488' Dropdown component
  kv_cache, // boolean  in 'parameter_2493' Checkbox component
  use_deepspeed, // boolean  in 'parameter_2494' Checkbox component
  half, // boolean  in 'parameter_2495' Checkbox component
  tokenizer, // string (Option from: ['quantifier_hubert_base_ls960.pth @ GitMylo/bark-voice-cloning', 'quantifier_hubert_base_ls960_14.pth @ GitMylo/bark-voice-cloning', 'quantifier_V1_hubert_base_ls960_23.pth @ GitMylo/bark-voice-cloning', 'polish-HuBERT-quantizer_8_epoch.pth @ Hobis/bark-voice-cloning-polish-HuBERT-quantizer', 'german-HuBERT-quantizer_14_epoch.pth @ CountFloyd/bark-voice-cloning-german-HuBERT-quantizer', 'es_tokenizer.pth @ Lancer1408/bark-es-tokenizer', 'portuguese-HuBERT-quantizer_24_epoch.pth @ MadVoyager/bark-voice-cloning-portuguese-HuBERT-quantizer']) in 'Tokenizer' Dropdown component
  use_basic_cleaners, // boolean  in 'parameter_2497' Checkbox component
}) {
  const app = await getClient();
  const tokenizer_file = await getFile(tokenizer);

  const result = (await app.predict("/tortoise_apply_model_settings", [
    model, // string (Option from: ['Default']) in 'parameter_2488' Dropdown component
    kv_cache, // boolean  in 'parameter_2493' Checkbox component
    use_deepspeed, // boolean  in 'parameter_2494' Checkbox component
    half, // boolean  in 'parameter_2495' Checkbox component
    // tokenizer, // string (Option from: ['quantifier_hubert_base_ls960.pth @ GitMylo/bark-voice-cloning', 'quantifier_hubert_base_ls960_14.pth @ GitMylo/bark-voice-cloning', 'quantifier_V1_hubert_base_ls960_23.pth @ GitMylo/bark-voice-cloning', 'polish-HuBERT-quantizer_8_epoch.pth @ Hobis/bark-voice-cloning-polish-HuBERT-quantizer', 'german-HuBERT-quantizer_14_epoch.pth @ CountFloyd/bark-voice-cloning-german-HuBERT-quantizer', 'es_tokenizer.pth @ Lancer1408/bark-es-tokenizer', 'portuguese-HuBERT-quantizer_24_epoch.pth @ MadVoyager/bark-voice-cloning-portuguese-HuBERT-quantizer']) in 'Tokenizer' Dropdown component
    tokenizer_file, // blob in 'Tokenizer' File component
    use_basic_cleaners, // boolean  in 'parameter_2497' Checkbox component
  ])) as {
    data: [
      Object // Models dropdown
    ];
  };

  return result?.data;
}

async function rvc({
  pitch_up_key,
  original_audio,
  index,
  pitch_collection_method,
  model,
  search_feature_ratio,
  device,
  use_half_precision_model,
  filter_radius_pitch,
  resample_sample_rate_bug,
  voice_envelope_normalizaiton,
  protect_breath_sounds,
}) {
  const original_audioBlob = await getFile(original_audio);
  // const indexPath = getIndex(index);
  // const modelPath = getModelPath(model);
  const indexPath = index;
  const modelPath = model;

  const app = await getClient();
  // const result = (await app.predict("/rvc", [
  const result = (await app.predict("/rvc_api", [
    pitch_up_key, // string  in 'Pitch Up key' Textbox component
    original_audioBlob, // blob in 'Original Audio' Audio component
    // indexBlob, // blob in 'Index' File component
    indexPath, // blob in 'Index' File component
    pitch_collection_method, // string (Option from: ['harvest', 'reaper', 'melodia']) in 'Pitch Collection Method' Radio component
    // modelBlob, // blob in 'Model' File component
    modelPath, // blob in 'Model' File component
    search_feature_ratio, // number (numeric value between 0.0 and 1.0) in 'Search Feature Ratio' Slider component
    device, // string (Option from: ['cuda:0', 'cpu', 'mps']) in 'Device' Dropdown component
    use_half_precision_model, // boolean  in 'Use half precision model (Depends on GPU support)' Checkbox component
    filter_radius_pitch, // number (numeric value between 0 and 10) in 'Filter Radius (Pitch)' Slider component
    resample_sample_rate_bug, // number (numeric value between 0 and 48000) in 'Resample Sample-rate (Bug)' Slider component
    voice_envelope_normalizaiton, // number (numeric value between 0.0 and 1.0) in 'Voice Envelope Normalizaiton' Slider component
    protect_breath_sounds, // number (numeric value between 0.0 and 0.5) in 'Protect Breath Sounds' Slider component
  ])) as {
    data: [
      GradioFile, // audio
      Object // metadata
    ];
  };

  const [audio, metadata] = result?.data;
  return {
    audio,
    metadata,
  };
}

async function rvc_model_reload() {
  const app = await getClient();

  const result = (await app.predict("/rvc_model_reload")) as {
    data: [
      {
        choices: string[];
        __type__: "update";
      }
    ];
  };

  return result?.data[0].choices.map(x => x[0]);
}

async function rvc_index_reload() {
  const app = await getClient();

  const result = (await app.predict("/rvc_index_reload")) as {
    data: [
      {
        choices: string[];
        __type__: "update";
      }
    ];
  };

  return result?.data[0].choices.map(x => x[0]);
}

// rvc_model_open

async function rvc_model_open() {
  const app = await getClient();

  const result = (await app.predict("/rvc_model_open")) as {};

  return result;
}

// rvc_index_open

async function rvc_index_open() {
  const app = await getClient();

  const result = (await app.predict("/rvc_index_open")) as {};

  return result;
}

// delete_generation

async function delete_generation({ history_bundle_name_data }) {
  const app = await getClient();

  const result = (await app.predict("/delete_generation", [
    history_bundle_name_data,
  ])) as {};

  return result;
}

// save_to_voices

async function save_to_voices({ history_npz }) {
  const app = await getClient();

  const result = (await app.predict("/save_to_voices", [history_npz])) as {
    data: [
      Object // save_button
    ];
  };

  return result;
}

// open_folder

async function open_folder({ folder }) {
  const app = await getClient();

  const result = (await app.predict("/open_folder", [folder])) as {};

  return result;
}

// save_environment_variables_bark

async function save_environment_variables_bark({
  use_small_models,
  enable_mps,
  offload_gpu_models_to_cpu,
}) {
  const app = await getClient();

  const result = (await app.predict("/save_environment_variables_bark", [
    use_small_models, // boolean  in 'Use small models' Checkbox component
    enable_mps, // boolean  in 'Enable MPS' Checkbox component
    offload_gpu_models_to_cpu, // boolean  in 'Offload GPU models to CPU' Checkbox component
  ])) as {
    data: [];
  };

  return result?.data;
}

// save_config_bark

async function save_config_bark({
  text_generation_use_gpu,
  text_generation_use_small_model,
  coarse_to_fine_inference_use_gpu,
  coarse_to_fine_inference_use_small_model,
  fine_tuning_use_gpu,
  fine_tuning_use_small_model,
  use_gpu_codec,
  load_models_on_startup,
}) {
  const app = await getClient();

  const result = (await app.predict("/save_config_bark", [
    text_generation_use_gpu, // boolean  in 'Use GPU' Checkbox component
    text_generation_use_small_model, // boolean  in 'Use small model' Checkbox component
    coarse_to_fine_inference_use_gpu, // boolean  in 'Use GPU' Checkbox component
    coarse_to_fine_inference_use_small_model, // boolean  in 'Use small model' Checkbox component
    fine_tuning_use_gpu, // boolean  in 'Use GPU' Checkbox component
    fine_tuning_use_small_model, // boolean  in 'Use small model' Checkbox component
    use_gpu_codec, // boolean  in 'Use GPU for codec' Checkbox component
    load_models_on_startup, // boolean  in 'Load Bark models on startup' Checkbox component
  ])) as {
    data: [
      string // string representing output in 'value_1541' Markdown component
    ];
  };

  return result?.data[0];
}

// get_config_bark

async function get_config_bark() {
  const app = await getClient();

  const result = (await app.predict("/get_config_bark", [])) as {
    data: [
      { value: boolean }, // boolean representing output in 'Use GPU' Checkbox component
      { value: boolean }, // boolean representing output in 'Use small model' Checkbox component
      { value: boolean }, // boolean representing output in 'Use GPU' Checkbox component
      { value: boolean }, // boolean representing output in 'Use small model' Checkbox component
      { value: boolean }, // boolean representing output in 'Use GPU' Checkbox component
      { value: boolean }, // boolean representing output in 'Use small model' Checkbox component
      { value: boolean }, // boolean representing output in 'Use GPU for codec' Checkbox component
      { value: boolean } // boolean representing output in 'Load Bark models on startup' Checkbox component
    ];
  };

  const [
    { value: text_generation_use_gpu },
    { value: text_generation_use_small_model },
    { value: coarse_to_fine_inference_use_gpu },
    { value: coarse_to_fine_inference_use_small_model },
    { value: fine_tuning_use_gpu },
    { value: fine_tuning_use_small_model },
    { value: use_gpu_codec },
    { value: load_models_on_startup },
  ] = result?.data;

  return {
    text_generation_use_gpu,
    text_generation_use_small_model,
    coarse_to_fine_inference_use_gpu,
    coarse_to_fine_inference_use_small_model,
    fine_tuning_use_gpu,
    fine_tuning_use_small_model,
    use_gpu_codec,
    load_models_on_startup,
  };
}

async function magnet({
  model,
  text,
  seed,
  use_sampling,
  top_k,
  top_p,
  temperature,
  max_cfg_coef,
  min_cfg_coef,
  decoding_steps_1,
  decoding_steps_2,
  decoding_steps_3,
  decoding_steps_4,
  span_arrangement,
}) {
  const app = await getClient();

  const result = (await app.predict("/magnet", [
    model,
    text,
    seed,
    use_sampling,
    top_k,
    top_p,
    temperature,
    max_cfg_coef,
    min_cfg_coef,
    decoding_steps_1,
    decoding_steps_2,
    decoding_steps_3,
    decoding_steps_4,
    span_arrangement,
  ])) as {
    data: [
      GradioFile, // output
      string, // history_bundle_name_data
      string, // image
      null, // seed_cache
      Object // result_json
    ];
  };

  const [audio, history_bundle_name_data, , , json] = result?.data;
  return {
    audio,
    history_bundle_name_data,
    json,
  };
}

// magnet_get_models

async function magnet_get_models() {
  const app = await getClient();

  const result = (await app.predict("/magnet_get_models")) as {
    data: [
      {
        choices: string[];
        __type__: "update";
      }
    ];
  };

  return result?.data[0].choices.map(x => x[0]);
}

// magnet_open_model_dir

async function magnet_open_model_dir() {
  const app = await getClient();

  const result = (await app.predict("/magnet_open_model_dir")) as {};

  return result;
}

const endpoints = {
  demucs,
  musicgen,
  magnet,
  magnet_get_models,
  magnet_open_model_dir,

  vocos_wav,
  vocos_npz,
  encodec_decode,
  bark_voice_tokenizer_load,
  bark_voice_generate,
  bark,
  reload_old_generation_dropdown,
  bark_favorite,
  delete_generation,

  tortoise,
  tortoise_refresh_models,
  tortoise_refresh_voices,
  tortoise_open_models,
  tortoise_open_voices,
  tortoise_apply_model_settings,

  rvc,
  rvc_model_reload,
  rvc_index_reload,
  rvc_model_open,
  rvc_index_open,
  save_to_voices,
  open_folder,

  save_environment_variables_bark,
  save_config_bark,
  get_config_bark,
};
