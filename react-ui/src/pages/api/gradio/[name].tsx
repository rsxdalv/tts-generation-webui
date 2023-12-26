import { client } from "@gradio/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getFile } from "../../../backend-utils/getFile";
import { GradioFile } from "../../../types/GradioFile";

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

  return result?.data[0].choices;
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

  return result?.data[0].choices;
}

const endpoints = {
  demucs,
  musicgen,
  vocos_wav,
  vocos_npz,
  encodec_decode,
  bark_voice_tokenizer_load,
  bark_voice_generate,
  bark,
  reload_old_generation_dropdown,
  bark_favorite,
  tortoise,
  tortoise_refresh_models,
};
