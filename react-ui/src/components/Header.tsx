import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const routes = [
  {
    href: "/",
    text: "Home",
  },
  {
    href: "/bark",
    text: "Bark",
  },
  {
    href: "/tortoise",
    text: "Tortoise",
  },
  {
    href: "/musicgen",
    text: "Musicgen",
  },
  {
    href: "/rvc",
    text: "RVC",
  },
  {
    href: "/demucs",
    text: "Demucs",
  },
  {
    href: "/vocos_wav",
    text: "Vocos Wav",
  },
  {
    href: "/vocos_npz",
    text: "Vocos NPZ",
  },
  {
    href: "/bark_voice_generation",
    text: "Bark Voice Generation",
  },
  {
    href: "/history/outputs",
    text: "History",
  },
  {
    href: "/history/favorites",
    text: "Favorites",
  },
  {
    href: "/voices",
    text: "Bark Voices",
  },
  {
    href: "/bark_settings",
    text: "Bark Settings",
  },
  // {
  //   href: "/history/collections",
  //   text: "History Collections",
  // },
  {
    href: "/generations",
    text: "Generations View (Beta)",
  },
  // {
  //   href: "/voice-drafts",
  //   text: "Voice Tree",
  // },
  {
    href: "https://echo.ps.ai/?utm_source=bark_speaker_directory",
    text: (
      <span>
        More Voices{" "}↗
      </span>
    ),
    target: "_blank",
  },
];

export const Header = ({}) => {
  const router = useRouter();
  const route = router.asPath.replace("/", "");

  return (
    <div className="flex flex-col items-center justify-center w-full p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold text-center text-gray-900">
        TTS Generation Webui
      </h1>
      <p className="text-lg text-center text-gray-700">
        {routes.map(({ href, text, target }, i) => (
          <React.Fragment key={href}>
            <Link
              href={href}
              className={highlightOnRoute(route, href.slice(1))}
              target={target}
            >
              {text}
            </Link>
            {i < routes.length - 1 && " | "}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
};

const highlightOnRoute = (route: string, match: string) =>
  route === match ? "font-bold" : "";
