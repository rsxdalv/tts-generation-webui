import { Inter } from "next/font/google";
import React from "react";

import { CardEmpty, CardGeneration } from "../components/CardBig";
import { getOggData } from "../data/getVoicesData";
import { GenerationRaw } from "../types/Generation";
import { Template } from "../components/Template";

export const inter = Inter({ subsets: ["latin"] });

export default function Home({
  generations,
}: {
  generations: GenerationRaw[];
}) {
  return (
    <Template>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {generations.map((generation) => (
          <CardGeneration key={generation.date} generation={generation} />
        ))}
        <CardEmpty
          title="Add a new generation"
          link="https://github.com/rsxdalv/bark-speaker-directory/pull/7"
        />
      </div>{" "}
    </Template>
  );
}

export const getStaticProps = async () => {
  const generations: GenerationRaw[] = await getOggData();
  return {
    props: {
      generations: generations,
    },
  };
};
