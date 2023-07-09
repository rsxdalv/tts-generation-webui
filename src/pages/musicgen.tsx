import React from "react";

import { CardEmpty, CardGeneration } from "../components/CardBig";
import { getMusicGenOggData } from "../data/getVoicesData";
import { GenerationRaw } from "../types/Generation";
import { Template } from "../components/Template";

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
          link="https://github.com/rsxdalv/musicgen-prompts/pull/1"
        />
      </div>{" "}
    </Template>
  );
}

export const getStaticProps = async () => {
  const generations: GenerationRaw[] = await getMusicGenOggData();
  return {
    props: {
      generations: generations,
    },
  };
};
