import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type Route = {
  href: string;
  text: string;
};

const routes: Route[] = [
  //   {
  //     href: "/",
  //     text: "Voices",
  //   },
  //   {
  //     href: "/generations",
  //     text: "Generations",
  //   },
  //   {
  //     href: "/voice-drafts",
  //     text: "Voice Tree",
  //   },
];

export const Header = ({}) => {
  const router = useRouter();
  const route = router.pathname.replace("/", "");

  return (
    <div className="flex flex-col items-center justify-center w-full p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold text-center text-gray-900">
        MusicGen Prompt Library
      </h1>
      <p className="text-md text-center text-gray-700">
        MusicGen is a simple and controllable model for music generation
        presented by Facebook AI Research.
        <br />
        See{" "}
        <a
          href="https://github.com/facebookresearch/audiocraft"
          className="text-blue-500"
        >
          github.com/facebookresearch/audiocraft
        </a>{" "}
        for more details.
      </p>
      <p className="text-lg text-center text-gray-700">
        {routes.map(({ href, text }) => (
          <React.Fragment key={href}>
            <Link
              href={href}
              className={highlightOnRoute(route, href.slice(1))}
            >
              {text}
            </Link>
            {href !== "/voice-drafts" && " | "}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
};

const highlightOnRoute = (route: string, match: string) =>
  route === match ? "font-bold" : "";
