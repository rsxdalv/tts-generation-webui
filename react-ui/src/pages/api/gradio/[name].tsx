import { client } from "@gradio/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getFile } from "../../../backend-utils/getFile";
import { GradioFile } from "../../../types/GradioFile";

type Data = { data: any };

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

const defaultBackend = process.env.GRADIO_BACKEND || "http://127.0.0.1:7860/";
const getClient = () => client(defaultBackend, {});

type GradioChoices = {
  choices: string[];
  __type__: "update";
};

const extractChoices = ({ choices }: GradioChoices) => choices.map((x) => x[0]);

const gradioPredict = <T extends any[]>(
  ...args: Parameters<Awaited<ReturnType<typeof getClient>>["predict"]>
) => getClient().then((app) => app.predict(...args)) as Promise<{ data: T }>;

async function demucs({ file }: { file: string }) {
  const audioBlob = await getFile(file);

  const result = await gradioPredict<
    [GradioFile, GradioFile, GradioFile, GradioFile]
  >("/demucs", [
    audioBlob, // blob in 'Input' Audio component
  ]);

  return result?.data;
}

async function vocos_wav({ audio, bandwidth }) {
  const audioBlob = await getFile(audio);

  const result = await gradioPredict<[GradioFile]>("/vocos_wav", [
    audioBlob, // blob in 'Input Audio' Audio component
    bandwidth, // string (Option from: ['1.5', '3.0', '6.0', '12.0']) in 'Bandwidth in kbps' Dropdown component
  ]);

  return result?.data[0];
}

async function vocos_npz({ npz_file }) {
  const npzBlob = await getFile(npz_file);

  const result = await gradioPredict<[GradioFile]>("/vocos_npz", [
    npzBlob, // blob in 'Input NPZ' File component
  ]);

  return result?.data[0];
}

async function encodec_decode({ npz_file }) {
  const npzBlob = await getFile(npz_file);

  const result = await gradioPredict<[GradioFile]>("/encodec_decode", [
    npzBlob, // blob in 'Input NPZ' File component
  ]);

  return result?.data[0];
}

async function musicgen({ melody, ...params }) {
  const melodyBlob = await getFile(melody);

  const result = await gradioPredict<
    [
      GradioFile, // output
      string, // history_bundle_name_data
      string, // image
      null, // seed_cache
      Object // result_json
    ]
  >("/musicgen", [
    {
      melody: null,
      ...params,
    },
    melodyBlob, // blob in 'Melody (optional)' Audio component
  ]);
  const [audio, history_bundle_name_data, , , json] = result?.data;
  return {
    audio,
    history_bundle_name_data,
    json,
  };
}

async function bark_voice_tokenizer_load({ tokenizer, use_gpu }) {
  const result = await gradioPredict<[string]>("/bark_voice_tokenizer_load", [
    tokenizer, // string (Option from: ['quantifier_hubert_base_ls960.pth @ GitMylo/bark-voice-cloning', 'quantifier_hubert_base_ls960_14.pth @ GitMylo/bark-voice-cloning', 'quantifier_V1_hubert_base_ls960_23.pth @ GitMylo/bark-voice-cloning', 'polish-HuBERT-quantizer_8_epoch.pth @ Hobis/bark-voice-cloning-polish-HuBERT-quantizer', 'german-HuBERT-quantizer_14_epoch.pth @ CountFloyd/bark-voice-cloning-german-HuBERT-quantizer', 'es_tokenizer.pth @ Lancer1408/bark-es-tokenizer', 'portuguese-HuBERT-quantizer_24_epoch.pth @ MadVoyager/bark-voice-cloning-portuguese-HuBERT-quantizer']) in 'Tokenizer' Dropdown component
    use_gpu, // boolean  in 'Use GPU' Checkbox component
  ]);

  return result?.data[0];
}

async function bark_voice_generate({ audio, use_gpu }) {
  const audioBlob = await getFile(audio);

  const result = await gradioPredict<
    [
      string, // string representing output in 'Voice file name' Textbox component
      GradioFile // { name: string; data: string; size?: number; is_file?: boolean; orig_name?: string} representing output in 'Encodec audio preview' Audio component
    ]
  >("/bark_voice_generate", [
    audioBlob, // blob in 'Input Audio' Audio component
    use_gpu, // boolean  in 'Use GPU' Checkbox component
  ]);

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
  seed: seed_input,
  history_prompt_semantic_dropdown,
}) {
  const result = await gradioPredict<
    [
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
    ]
  >("/bark", [
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
  ]);

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

const reload_old_generation_dropdown = () =>
  gradioPredict<[GradioChoices]>("/reload_old_generation_dropdown").then(
    (result) => extractChoices(result?.data[0])
  );

const bark_favorite = async ({ history_bundle_name_data }) =>
  gradioPredict<[Object]>("/bark_favorite", [history_bundle_name_data]).then(
    (result) => result?.data
  );

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
  const result = await gradioPredict<
    [
      GradioFile, // audio
      string, // image
      Object, // save_button
      string, // seed
      string, // bundle_name
      Object // metadata
    ]
  >("/generate_tortoise_1", [
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
  ]);

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

const tortoise_refresh_models = () =>
  gradioPredict<[GradioChoices]>("/tortoise_refresh_models").then((result) =>
    extractChoices(result?.data[0])
  );

const tortoise_refresh_voices = () =>
  gradioPredict<[GradioChoices]>("/tortoise_refresh_voices").then((result) =>
    extractChoices(result?.data[0])
  );

const tortoise_open_models = () => gradioPredict<[]>("/tortoise_open_models");
const tortoise_open_voices = () => gradioPredict<[]>("/tortoise_open_voices");

async function tortoise_apply_model_settings({
  model, // string (Option from: ['Default']) in 'parameter_2488' Dropdown component
  kv_cache, // boolean  in 'parameter_2493' Checkbox component
  use_deepspeed, // boolean  in 'parameter_2494' Checkbox component
  half, // boolean  in 'parameter_2495' Checkbox component
  tokenizer, // string (Option from: ['quantifier_hubert_base_ls960.pth @ GitMylo/bark-voice-cloning', 'quantifier_hubert_base_ls960_14.pth @ GitMylo/bark-voice-cloning', 'quantifier_V1_hubert_base_ls960_23.pth @ GitMylo/bark-voice-cloning', 'polish-HuBERT-quantizer_8_epoch.pth @ Hobis/bark-voice-cloning-polish-HuBERT-quantizer', 'german-HuBERT-quantizer_14_epoch.pth @ CountFloyd/bark-voice-cloning-german-HuBERT-quantizer', 'es_tokenizer.pth @ Lancer1408/bark-es-tokenizer', 'portuguese-HuBERT-quantizer_24_epoch.pth @ MadVoyager/bark-voice-cloning-portuguese-HuBERT-quantizer']) in 'Tokenizer' Dropdown component
  use_basic_cleaners, // boolean  in 'parameter_2497' Checkbox component
}) {
  const tokenizer_file = await getFile(tokenizer);

  const result = await gradioPredict<[Object]>(
    "/tortoise_apply_model_settings",
    [
      model, // string (Option from: ['Default']) in 'parameter_2488' Dropdown component
      kv_cache, // boolean  in 'parameter_2493' Checkbox component
      use_deepspeed, // boolean  in 'parameter_2494' Checkbox component
      half, // boolean  in 'parameter_2495' Checkbox component
      // tokenizer, // string (Option from: ['quantifier_hubert_base_ls960.pth @ GitMylo/bark-voice-cloning', 'quantifier_hubert_base_ls960_14.pth @ GitMylo/bark-voice-cloning', 'quantifier_V1_hubert_base_ls960_23.pth @ GitMylo/bark-voice-cloning', 'polish-HuBERT-quantizer_8_epoch.pth @ Hobis/bark-voice-cloning-polish-HuBERT-quantizer', 'german-HuBERT-quantizer_14_epoch.pth @ CountFloyd/bark-voice-cloning-german-HuBERT-quantizer', 'es_tokenizer.pth @ Lancer1408/bark-es-tokenizer', 'portuguese-HuBERT-quantizer_24_epoch.pth @ MadVoyager/bark-voice-cloning-portuguese-HuBERT-quantizer']) in 'Tokenizer' Dropdown component
      tokenizer_file, // blob in 'Tokenizer' File component
      use_basic_cleaners, // boolean  in 'parameter_2497' Checkbox component
    ]
  );

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
  resample_sample_rate,
  voice_envelope_normalizaiton,
  protect_breath_sounds,
}) {
  const original_audioBlob = await getFile(original_audio);

  const result = await gradioPredict<[GradioFile, Object]>("/rvc", [
    pitch_up_key, // string  in 'Pitch Up key' Textbox component
    original_audioBlob, // blob in 'Original Audio' Audio component
    index, // string in 'Index' Dropdown component
    pitch_collection_method, // string (Option from: ['harvest', 'reaper', 'melodia']) in 'Pitch Collection Method' Radio component
    model, // string in 'Model' Dropdown component
    search_feature_ratio, // number (numeric value between 0.0 and 1.0) in 'Search Feature Ratio' Slider component
    device, // string (Option from: ['cuda:0', 'cpu', 'mps']) in 'Device' Dropdown component
    use_half_precision_model, // boolean  in 'Use half precision model (Depends on GPU support)' Checkbox component
    filter_radius_pitch, // number (numeric value between 0 and 10) in 'Filter Radius (Pitch)' Slider component
    resample_sample_rate, // number (numeric value between 0 and 48000) in 'Resample Sample-rate (Bug)' Slider component
    voice_envelope_normalizaiton, // number (numeric value between 0.0 and 1.0) in 'Voice Envelope Normalizaiton' Slider component
    protect_breath_sounds, // number (numeric value between 0.0 and 0.5) in 'Protect Breath Sounds' Slider component
  ]);

  const [audio, metadata] = result?.data;
  return {
    audio,
    metadata,
  };
}

const rvc_model_reload = () =>
  gradioPredict<[GradioChoices]>("/rvc_model_reload").then((result) =>
    extractChoices(result?.data[0])
  );

const rvc_index_reload = () =>
  gradioPredict<[GradioChoices]>("/rvc_index_reload").then((result) =>
    extractChoices(result?.data[0])
  );

const rvc_model_open = () => gradioPredict<[]>("/rvc_model_open");

const rvc_index_open = () => gradioPredict<[]>("/rvc_index_open");

const delete_generation = ({ history_bundle_name_data }) =>
  gradioPredict<[]>("/delete_generation", [history_bundle_name_data]);

const save_to_voices = ({ history_npz }) =>
  gradioPredict<[Object]>("/save_to_voices", [history_npz]);

const open_folder = ({ folder }) => gradioPredict<[]>("/open_folder", [folder]);

const save_environment_variables_bark = ({
  use_small_models,
  enable_mps,
  offload_gpu_models_to_cpu,
}) =>
  gradioPredict<[]>("/save_environment_variables_bark", [
    use_small_models, // boolean  in 'Use small models' Checkbox component
    enable_mps, // boolean  in 'Enable MPS' Checkbox component
    offload_gpu_models_to_cpu, // boolean  in 'Offload GPU models to CPU' Checkbox component
  ]).then((result) => result?.data);

const save_config_bark = ({
  text_generation_use_gpu,
  text_generation_use_small_model,
  coarse_to_fine_inference_use_gpu,
  coarse_to_fine_inference_use_small_model,
  fine_tuning_use_gpu,
  fine_tuning_use_small_model,
  use_gpu_codec,
  load_models_on_startup,
}) =>
  gradioPredict<
    [
      string // string representing output in 'value_1541' Markdown component
    ]
  >("/save_config_bark", [
    text_generation_use_gpu, // boolean  in 'Use GPU' Checkbox component
    text_generation_use_small_model, // boolean  in 'Use small model' Checkbox component
    coarse_to_fine_inference_use_gpu, // boolean  in 'Use GPU' Checkbox component
    coarse_to_fine_inference_use_small_model, // boolean  in 'Use small model' Checkbox component
    fine_tuning_use_gpu, // boolean  in 'Use GPU' Checkbox component
    fine_tuning_use_small_model, // boolean  in 'Use small model' Checkbox component
    use_gpu_codec, // boolean  in 'Use GPU for codec' Checkbox component
    load_models_on_startup, // boolean  in 'Load Bark models on startup' Checkbox component
  ]).then((result) => result?.data[0]);

// get_config_bark

async function get_config_bark() {
  const result = await gradioPredict<
    [
      { value: boolean }, // boolean representing output in 'Use GPU' Checkbox component
      { value: boolean }, // boolean representing output in 'Use small model' Checkbox component
      { value: boolean }, // boolean representing output in 'Use GPU' Checkbox component
      { value: boolean }, // boolean representing output in 'Use small model' Checkbox component
      { value: boolean }, // boolean representing output in 'Use GPU' Checkbox component
      { value: boolean }, // boolean representing output in 'Use small model' Checkbox component
      { value: boolean }, // boolean representing output in 'Use GPU for codec' Checkbox component
      { value: boolean } // boolean representing output in 'Load Bark models on startup' Checkbox component
    ]
  >("/get_config_bark", []);

  const [
    text_generation_use_gpu,
    text_generation_use_small_model,
    coarse_to_fine_inference_use_gpu,
    coarse_to_fine_inference_use_small_model,
    fine_tuning_use_gpu,
    fine_tuning_use_small_model,
    use_gpu_codec,
    load_models_on_startup,
  ] = result?.data.map((x) => x.value);

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
  const result = await gradioPredict<
    [
      GradioFile, // output
      string, // history_bundle_name_data
      string, // image
      null, // seed_cache
      Object // result_json
    ]
  >("/magnet", [
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
  ]);

  const [audio, history_bundle_name_data, , , json] = result?.data;
  return {
    audio,
    history_bundle_name_data,
    json,
  };
}

const magnet_get_models = () =>
  gradioPredict<[GradioChoices]>("/magnet_get_models").then((result) =>
    extractChoices(result?.data[0])
  );

const magnet_open_model_dir = () => gradioPredict<[]>("/magnet_open_model_dir");

const maha = ({
  maha_tts_input,
  model_language,
  maha_tts_language,
  speaker_name,
  seed,
  device,
}) =>
  gradioPredict<[GradioFile, Object]>("/maha_tts", [
    maha_tts_input, // string  in 'Input' Textbox component
    model_language, // string (Option from: ['en', 'de', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'ru', 'tr', 'zh']) in 'Model language' Dropdown component
    maha_tts_language, // string (Option from: ['en', 'de', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'ru', 'tr', 'zh']) in 'TTS language' Dropdown component
    speaker_name, // string  in 'Speaker name' Textbox component
    seed, // number  in 'Seed' Number component
    device, // string (Option from: ['cpu', 'cuda']) in 'Device' Dropdown component
  ]).then((result) => {
    const [audio, metadata] = result?.data;
    return {
      audio,
      metadata,
    };
  });

// maha_tts_refresh_voices

const maha_tts_refresh_voices = () =>
  gradioPredict<[GradioChoices]>("/maha_tts_refresh_voices").then((result) =>
    extractChoices(result?.data[0])
  );

const get_gpu_info = () =>
  gradioPredict<[Object]>("/get_gpu_info").then((result) => result?.data[0]);

const mms = ({
  text,
  language,
  speaking_rate,
  noise_scale,
  noise_scale_duration,
}: {
  text: string;
  language: string;
  speaking_rate: number;
  noise_scale: number;
  noise_scale_duration: number;
}) =>
  gradioPredict<[GradioFile]>("/mms", [
    text, // string  in 'Input Text' Textbox component
    language, // string (Option from: ['eng', 'deu', 'fra', 'ita', 'por', 'spa', 'zho']) in 'Language' Dropdown component
    speaking_rate, // number  in 'Speaking Rate' Number component
    noise_scale, // number  in 'Noise Scale' Number component
    noise_scale_duration, // number  in 'Noise Scale Duration' Number component
  ]).then((result) => {
    const [audio] = result?.data;
    return {
      audio,
      metadata: {
        _version: "",
        _hash_version: "",
        _type: "",
        text,
        language,
        speaking_rate,
        noise_scale,
        noise_scale_duration,
      },
    };
  });

const endpoints = {
  maha,
  maha_tts_refresh_voices,
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

  mms,

  get_gpu_info,
};
