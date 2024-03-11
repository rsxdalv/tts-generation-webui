import { Inter } from "next/font/google";
import React from "react";

import { HistoryCard } from "../../components/CardBig";
import { getDataFromJSON } from "../../data/getVoicesData";
import { GenerationRaw } from "../../types/Generation";
import { Template } from "../../components/Template";
import Head from "next/head";

export const inter = Inter({ subsets: ["latin"] });

interface Props {
  outputs: GenerationRaw[];
  isFavorites?: boolean;
}

export default function Home({ outputs, isFavorites = false }: Props) {
  return (
    <Template>
      <Head>
        <title>
          {`${isFavorites ? "Favorites" : "History"} - TTS Generation Webui`}
        </title>
      </Head>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {outputs.map((generation) => (
          <HistoryCard
            key={generation.filename}
            metadata={generation}
            isFavorite={isFavorites}
          />
        ))}
      </div>
    </Template>
  );
}

export const getStaticProps = async ({ params: { name } }) => {
  const outputs: GenerationRaw[] = await getDataFromJSON(name);
  return {
    props: {
      outputs,
      isFavorites: name === "favorites",
    },
  } as { props: Props };
};

export const getStaticPaths = async () => {
  return {
    paths: [
      "/history/outputs",
      "/history/favorites",
      // "/history/collections",
    ],
    fallback: "blocking",
  };
};
