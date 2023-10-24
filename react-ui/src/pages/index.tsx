import { Inter } from "next/font/google";
import React from "react";

import { Favorites } from "../components/FavoritesProvider";
import { CardBig, CardEmpty } from "../components/CardBig";
import { Voice } from "../types/Voice";
import { getVoicesData } from "../data/getVoicesData";
import { Template } from "../components/Template";
import Head from "next/head";

export const inter = Inter({ subsets: ["latin"] });

export default function Home({ voices }: { voices: Voice[] }) {
  return (
    <Template>
      <Head>
        <title>TTS Generation Webui</title>
      </Head>
    </Template>
  );
}

export const getStaticProps = async () => {
  const voices: Voice[] = getVoicesData();
  return {
    props: {
      voices: voices,
    },
  };
};
