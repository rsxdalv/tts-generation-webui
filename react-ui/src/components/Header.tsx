import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type Route = {
  href: string;
  text: string | React.ReactNode;
  target?: string;
  subroutes?: Route[];
};

const routes: Route[] = [
  {
    href: "/",
    text: "Home",
  },
  {
    href: "/pipeline",
    text: "Pipeline",
  },
  {
    href: "/bark",
    text: "Bark",
    subroutes: [
      {
        href: "/bark",
        text: "Generation",
      },
      {
        href: "/bark/bark_voice_generation",
        text: "Voice Generation",
      },
      {
        href: "/bark/voices",
        text: "Voices",
      },
      {
        href: "/bark/bark_settings",
        text: "Settings",
      },
      {
        href: "/bark/vocos_wav",
        text: "Vocos Wav",
      },
      {
        href: "/bark/vocos_npz",
        text: "Vocos NPZ",
      },
      {
        href: "https://promptecho.com/?utm_source=react_ui",
        text: <span>More Voices&nbsp;↗</span>,
        target: "_blank",
      },
    ],
  },
  {
    href: "/tortoise",
    text: "Tortoise",
  },
  {
    href: "/musicgen",
    text: "MusicGen",
  },
  {
    href: "/magnet",
    text: "MAGNeT",
  },
  {
    href: "/demucs",
    text: "Demucs",
  },
  {
    href: "/rvc",
    text: "RVC",
  },
  {
    href: "/maha-tts",
    text: "Maha TTS",
  },
  {
    href: "/mms",
    text: "MMS",
  },
  {
    href: "/vallex",
    text: "Vall-E-X",
  },
  {
    href: "/gpu_info",
    text: "GPU Info",
  },
  {
    href: "/history/outputs",
    text: "History",
  },
  {
    href: "/history/favorites",
    text: "Favorites",
  },
  // {
  //   href: "/history/collections",
  //   text: "History Collections",
  // },
  // {
  //   href: "/generations",
  //   text: "Generations View (Beta)",
  // },
  // {
  //   href: "/voice-drafts",
  //   text: "Voice Tree",
  // },
];

const highlightOnRoute = (route: string, match: string) =>
  route === match ? "font-bold" : "hover:text-gray-400";

export const Header = ({}) => {
  const router = useRouter();
  const route = router.asPath.replace("/", "");

  const currentRoute =
    routes.find((r) => r.href.slice(1) === route) ||
    routes.find(
      (r) => r.href.slice(1) === route.slice(0, route.lastIndexOf("/"))
    );

  const subroutes = currentRoute?.subroutes;

  const renderLink = (
    { href, text, target }: Route,
    i: number,
    arr: Route[]
  ) => (
    <React.Fragment key={href}>
      <Link
        href={href}
        className={
          highlightOnRoute(route, href.slice(1)) +
          " whitespace-pre"
        }
        target={target}
      >
        {text}
      </Link>
      {i < arr.length - 1 && " | "}
    </React.Fragment>
  );

  const RouteList = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center w-full p-2 bg-white rounded-lg shadow-lg">
      <p className="text-base text-center text-gray-700">{children}</p>
    </div>
  );

  return (
    <>
      <div className="flex items-center w-full pb-1">
        <h1 className="text-3xl font-bold text-start w-full text-gray-900">
          TTS Generation Webui
        </h1>
        <a
          href="https://github.com/rsxdalv/tts-generation-webui"
          target="_blank"
          className="text-gray-500 hover:underline"
        >
          GitHub
        </a>
      </div>
      <RouteList>{routes.map(renderLink)}</RouteList>
      {subroutes && (
        <RouteList>
          {currentRoute?.text} {"> "}
          {subroutes.map(renderLink)}
        </RouteList>
      )}
    </>
  );
};
