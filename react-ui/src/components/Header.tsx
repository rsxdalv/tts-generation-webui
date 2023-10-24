import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const routes = [
  {
    href: "/musicgen",
    text: "Musicgen",
  },
  {
    href: "/demucs",
    text: "Demucs",
  },
  // {
  //   href: "/",
  //   text: "Voices",
  // },
  {
    href: "/generations",
    text: "Favorites",
  },
  // {
  //   href: "/voice-drafts",
  //   text: "Voice Tree",
  // },
  // {
  //   href: "https://echo.ps.ai/?utm_source=bark_speaker_directory",
  //   text: "More Voices",
  //   target: "_blank",
  // },
];

export const Header = ({}) => {
  // get route from next.js router
  const router = useRouter();
  const route = router.pathname.replace("/", "");

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
