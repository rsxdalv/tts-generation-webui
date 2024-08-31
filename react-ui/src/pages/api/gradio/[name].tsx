import { Client } from "@gradio/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getFile } from "../../../backend-utils/getFile";
import { GradioFile } from "../../../types/GradioFile";
import { PayloadMessage, PredictFunction } from "@gradio/client/dist/types";

type Data = { data: any };

// import { Client, handle_file } from "@gradio/client";

// const response = await fetch(
// 	"https://audio-samples.github.io/samples/mp3/blizzard_unconditional/sample-0.mp3"
// );
// const audio_file = await response.blob();

// const app = await Client.connect("abidlabs/whisper");
// const result = await app.predict("/predict", [handle_file(audio_file)]);

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

const defaultBackend =
  process.env.GRADIO_BACKEND ||
  process.env.GRADIO_BACKEND_AUTOMATIC ||
  "http://127.0.0.1:7770/";

const getClient = () => Client.connect(defaultBackend, {});

type GradioChoices = {
  choices: string[];
  __type__: "update";
};

const extractChoices = ({ choices }: GradioChoices) => choices.map((x) => x[0]);
const extractChoicesTuple = ({ choices }: GradioChoices) =>
  choices.map((x) => x[1]);

const gradioPredict = <T extends any[]>(...args: Parameters<PredictFunction>) =>
  getClient().then((app) => app.predict(...args)) as Promise<{ data: T }>;

const gradioSubmit = <T extends any[]>(...args: Parameters<PredictFunction>) =>
  getClient().then((app) => app.submit(...args));

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

async function musicgen({ melody, model, ...params }) {
  const melodyBlob = await getFile(melody);

  const result = await gradioPredict<[GradioFile, Object, string]>(
    "/musicgen",
    {
      melody: melodyBlob,
      model_name: model,
      ...params,
    }
  );
  const [audio, metadata, folder_root] = result?.data;
  return { audio, metadata, folder_root };
}

const bark_voice_tokenizer_load = ({ tokenizer, use_gpu }) =>
  gradioPredict<[string]>("/bark_voice_tokenizer_load", [
    tokenizer,
    use_gpu,
  ]).then((result) => result?.data);

async function bark_voice_generate({ audio, use_gpu }) {
  const audioBlob = await getFile(audio);

  const result = await gradioPredict<[string, GradioFile]>(
    "/bark_voice_generate",
    [audioBlob, use_gpu]
  );

  const [filename, preview] = result?.data;
  return { filename, preview };
}

async function bark({
  burn_in_prompt,
  text,
  text_temp,
  waveform_temp,
  long_prompt_radio,
  long_prompt_history_radio,
  seed,
  max_length,

  history_prompt,
  history_prompt_semantic,
}) {
  const result = await gradioPredict<[GradioFile, string, Object, string]>(
    "/bark",
    {
      seed,
      text,
      burn_in_prompt,
      text_temp,
      waveform_temp,
      max_length,
      history_prompt,
      history_prompt_semantic,
      long_prompt_radio,
      long_prompt_history_radio,
    }
  );
  const [audio, npz, metadata, folder_root] = result?.data;
  return {
    audio: { ...audio, data: audio.url },
    npz,
    metadata,
    folder_root,
  };
}

const reload_old_generation_dropdown = () =>
  gradioPredict<[GradioChoices]>("/reload_old_generation_dropdown").then(
    (result) => extractChoices(result?.data[0])
  );

const bark_favorite = async ({ folder_root }) =>
  gradioPredict<[Object]>("/bark_favorite", [folder_root]).then(
    (result) => result?.data
  );

async function Array__fromAsync<T>(gen: AsyncIterable<T>): Promise<T[]> {
  let out: T[] = [];
  for await (const x of gen) {
    // Oh how I love you V8 with your bugs. This prevents invalid memory deduplication when adding the output to an array in a complicated system.
    let y = JSON.parse(JSON.stringify(x));
    out.push(y as any);
  }
  return out;
}

async function tortoise({
  text,
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
  // use_random_seed,
  candidates,
}) {
  const job = await gradioSubmit<[GradioFile, string, Object]>(
    "/generate_tortoise_" + candidates,
    [
      text, // string  in 'Prompt' Textbox component
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
    ]
  );

  const events = await Array__fromAsync(job);
  const results = events
    .filter<PayloadMessage>((x): x is PayloadMessage => x.type === "data")
    .map((x: PayloadMessage) => {
      const [audio, bundle_name, metadata] = x.data;
      return {
        audio,
        seed,
        bundle_name,
        metadata,
      };
    });
  // remove last element due to return {} in generate_tortoise_long
  return results.slice(0, -1);
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
  // device,
  // use_half_precision_model,
  filter_radius_pitch,
  resample_sample_rate,
  voice_envelope_normalizaiton,
  protect_breath_sounds,
}) {
  const original_audioBlob = await getFile(original_audio);

  const result = await gradioPredict<any>("/rvc", {
    pitch_up_key, // string  in 'Pitch Up key' Textbox component
    original_audio_path: original_audioBlob, // blob in 'Original Audio' Audio component
    index_path: index, // string in 'Index' Dropdown component
    pitch_collection_method, // string (Option from: ['harvest', 'reaper', 'melodia']) in 'Pitch Collection Method' Radio component
    model_path: model, // string in 'Model' Dropdown component
    index_rate: search_feature_ratio, // number (numeric value between 0.0 and 1.0) in 'Search Feature Ratio' Slider component
    filter_radius: filter_radius_pitch, // number (numeric value between 0 and 10) in 'Filter Radius (Pitch)' Slider component
    resample_sr: resample_sample_rate, // number (numeric value between 0 and 48000) in 'Resample Sample-rate (Bug)' Slider component
    rms_mix_rate: voice_envelope_normalizaiton, // number (numeric value between 0.0 and 1.0) in 'Voice Envelope Normalizaiton' Slider component
    protect: protect_breath_sounds, // number (numeric value between 0.0 and 0.5) in 'Protect Breath Sounds' Slider component
  });

  const [audio, metadata] = result?.data;
  return { audio, metadata };
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

const delete_generation = ({ folder_root }) =>
  gradioPredict<[]>("/delete_generation", [folder_root]);

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
  gradioPredict<[string]>("/save_config_bark", [
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

const magnet = (params) =>
  gradioPredict<[GradioFile, Object, string]>("/magnet", params).then(
    (result) => {
      const [audio, metadata, folder_root] = result?.data;
      return { audio, metadata, folder_root };
    }
  );

const magnet_get_models = () =>
  gradioPredict<[GradioChoices]>("/magnet_get_models").then((result) =>
    extractChoicesTuple(result?.data[0])
  );

const magnet_open_model_dir = () => gradioPredict<[]>("/magnet_open_model_dir");

const maha = (params) =>
  gradioPredict<[GradioFile, Object, string]>("/maha_tts", params).then(
    (result) => {
      const [audio, metadata, folder_root] = result?.data;
      return { audio, folder_root, metadata };
    }
  );

const maha_tts_refresh_voices = () =>
  gradioPredict<[GradioChoices]>("/maha_tts_refresh_voices").then((result) =>
    extractChoices(result?.data[0])
  );

const get_gpu_info = () =>
  gradioPredict<[Object]>("/get_gpu_info").then((result) => result?.data[0]);

const mms = (params) =>
  gradioPredict<[GradioFile, Object, string]>("/mms", params).then((result) => {
    const [audio, metadata, folder_root] = result?.data;
    return { audio, metadata, folder_root };
  });

const vall_e_x_generate = (params) =>
  gradioPredict<[GradioFile, Object, string]>(
    "/vall_e_x_generate",
    params
  ).then((result) => {
    const [audio, metadata, folder_root] = result?.data;
    return { audio, metadata, folder_root };
  });

const vall_e_x_split_text_into_sentences = ({ text }) =>
  gradioPredict<string[]>("/vall_e_x_split_text_into_sentences", [text]).then(
    (result) => ({ split_text: result?.data?.[0] })
  );

const vall_e_x_tokenize = ({ text, language }) =>
  gradioPredict<string[]>("/vall_e_x_tokenize", [text, language]).then(
    (result) => ({ tokens: result?.data?.[0] })
  );

const scan_huggingface_cache_api = () =>
  gradioPredict<any[]>("/scan_huggingface_cache_api").then(
    (result) => result?.data?.[0]
  );

const delete_huggingface_cache_revisions = ({ commit_hash }) =>
  gradioPredict<[]>("/delete_huggingface_cache_revisions", [commit_hash]);

const tortoise_unload_model = () => gradioPredict<[]>("/tortoise_unload_model");

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

  vall_e_x_generate,
  vall_e_x_split_text_into_sentences,
  vall_e_x_tokenize,

  scan_huggingface_cache_api,
  delete_huggingface_cache_revisions,

  tortoise_unload_model,
};
