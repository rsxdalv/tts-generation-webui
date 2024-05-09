import { Inter } from "next/font/google";
import React from "react";
import Link from "next/link";

import { Template } from "../components/Template";
import Head from "next/head";

export const inter = Inter({ subsets: ["latin"] });

const LinkButton = ({
  href,
  children,
  target,
}: {
  href: string;
  children: React.ReactNode;
  target?: string;
}) => (
  <Link
    href={href}
    className="border border-gray-300 p-2 rounded hover:bg-gray-200"
    target={target}
  >
    {children}
  </Link>
);

const Card = ({
  title,
  description,
  href,
  projectLink,
}: {
  title: string;
  description: string;
  href: string;
  projectLink?: string;
}) => (
  <div className="flex flex-row justify-between gap-x-2 items-start border border-gray-300 p-2 rounded">
    <h3 className="text-lg font-medium">{title}</h3>
    <p className="text-base">{description}</p>
    <LinkButton href={href}>Run</LinkButton>
    {projectLink && (
      <LinkButton href={projectLink} target="_blank">
        Github
      </LinkButton>
    )}
  </div>
);

export default function Home() {
  return (
    <Template>
      <Head>
        <title>TTS Generation Webui</title>
      </Head>
      <div className="text-center space-y-4 max-w-2xl mx-auto mb-auto">
        <h2 className="text-2xl font-bold">Welcome to the TTS Webui!</h2>
        <p className="text-lg">
          This is a web interface for the TTS project. It allows you to generate
          audio using the TTS models.
        </p>
        <p className="text-lg">
          To get started, select a tab above to choose a model and generate some
          audio.
        </p>
        <p className="text-lg">
          You can also listen to some of the voices that have been generated
          using the &quot;Favorites&quot; button.
        </p>
        <div className="flex flex-col gap-y-2">
          <h3 className="text-xl font-bold">Generation Models:</h3>
          <div className="flex flex-col gap-y-2">
            <Card
              title="Bark"
              description="Bark is a text-to-speech model that can generate speech from text."
              href="/bark"
              projectLink="https://github.com/suno-ai/bark"
            />
            <Card
              title="Tortoise"
              description="Tortoise is a text-to-speech model that can generate speech from text."
              href="/tortoise"
              projectLink="https://github.com/neonbjb/tortoise-tts"
            />
            <Card
              title="Musicgen Audiogen"
              description="MusicGen is a state-of-the-art controllable text-to-music model. AudioGen is a state-of-the-art text-to-sound model."
              href="/musicgen"
              projectLink="https://github.com/facebookresearch/audiocraft"
            />
            <Card
              title="MAGNeT"
              description="A state-of-the-art non-autoregressive model for text-to-music and text-to-sound."
              href="/magnet"
              projectLink="https://github.com/facebookresearch/audiocraft"
            />
            <Card
              title="Maha TTS"
              description="Maha TTS is a text-to-speech model that can generate speech from text, supports many Indian languages."
              href="/maha-tts"
              projectLink="https://github.com/dubverse-ai/MahaTTS"
            />
          </div>
          <h3 className="text-xl font-bold">Post-Processing Models:</h3>
          <div className="flex flex-col gap-y-2">
            <Card
              title="RVC"
              description="An easy-to-use voice conversion framework based on VITS."
              href="/rvc"
              projectLink="https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI"
            />
            <Card
              title="Demucs"
              description="Demucs is a post-processing model for Music Source Separation."
              href="/demucs"
              projectLink="https://github.com/facebookresearch/demucs"
            />
            <Card
              title="Vocos Wav"
              description="Vocos Wav is a post-processing model that can refine the output of a text-to-speech model."
              href="/bark/vocos_wav"
              projectLink="https://github.com/gemelo-ai/vocos"
            />
            <Card
              title="Vocos NPZ"
              description="Vocos NPZ is a post-processing model that can refine the output of a Bark."
              href="/bark/vocos_npz"
              projectLink="https://github.com/gemelo-ai/vocos"
            />
          </div>
        </div>
      </div>
    </Template>
  );
}

export const getStaticProps = async () => {
  return {
    props: {},
  };
};
