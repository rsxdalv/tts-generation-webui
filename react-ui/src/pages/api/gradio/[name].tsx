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
