import { Inter } from "next/font/google";
import React from "react";

import { Voice } from "../types/Voice";
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
  return {
    props: {},
  };
};
