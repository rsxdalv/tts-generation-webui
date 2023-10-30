import { client } from "@gradio/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getFile } from "../../../backend-utils/getFile";
import { GradioFile } from "../../../types/GradioFile";

type Data = { data: any };

const defaultBackend = "http://127.0.0.1:7865/";
const getClient = () => client(defaultBackend, {});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { name } = req.query;
  console.log("gradio api handler", name, req.body);

  const endpoints = {
    demucs,
    musicgen,
    vocos_wav,
    vocos_npz,
    encodec_decode,
    bark_voice_tokenizer_load,
    bark_voice_generate,
  };
  if (!name || typeof name !== "string" || !endpoints[name]) {
    res.status(404).json({ data: { error: "Not found" } });
    return;
  }

  const body = JSON.parse(req.body);
  const result = await endpoints[name](body);

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
      any, // history_bundle_name_data
      any, // image
      any, // seed_cache
      any // result_json
    ];
  };
  return result?.data;
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

  return {
    filename: result?.data[0],
    preview: result?.data[1],
  };
}
