import { Inter } from "next/font/google";
import React from "react";

import { getNpzDataSimpleVoices } from "../../data/getVoicesData";
import { Template } from "../../components/Template";
import Head from "next/head";
import { CardVoiceNpz } from "../../components/CardBig";
import { NPZ } from "../../types/NPZ";

export const inter = Inter({ subsets: ["latin"] });

interface Props {
  outputs: NPZ[];
}

export default function Voices({ outputs }: Props) {
  return (
    <Template>
      <Head>
        <title>Favorites - TTS Generation Webui</title>
      </Head>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {outputs.map((npz) => (
          <CardVoiceNpz key={npz.filename} generation={npz} />
        ))}
      </div>
    </Template>
  );
}

export const getStaticProps = async ({}): Promise<{ props: Props }> => {
  const outputs: NPZ[] = await getNpzDataSimpleVoices();
  return {
    props: {
      outputs,
    },
  };
};
