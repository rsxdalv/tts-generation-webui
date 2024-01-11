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
      <div className="text-center space-y-4 max-w-2xl mx-auto mb-auto">
        <h1 className="text-3xl font-bold">Welcome to the TTS Webui!</h1>
        <p className="text-xl">
          This is a web interface for the TTS project. It allows you to generate
          audio using the TTS models.
        </p>
        <p className="text-xl">
          To get started, select a tab above to choose a model and generate some
          audio.
        </p>
        <p className="text-xl">
          You can also listen to some of the voices that have been generated
          using the &quot;Favorites&quot; button.
        </p>
      </div>
    </Template>
  );
}

export const getStaticProps = async () => {
  return {
    props: {},
  };
};
