import React from "react";
import dynamic from "next/dynamic";

import { Template } from "../../components/Template";
import { Button } from "../../components/ui/button";

export default function Home({ name }) {
  const ExtensionPage = dynamic(
    () => import("../../extensions/link").then((m) => m[name] || (() => null)),
    {
      ssr: false,
    }
  );
  return (
    <Template title={name}>
      <ExtensionPage {...({ Button } as any)} />
    </Template>
  );
}

export const getStaticProps = async ({ params: { name } }) => {
  return { props: { name } };
};

export const getStaticPaths = async () => {
  return {
    paths: ["/extensions/extension_xtts_simple"],
    fallback: "blocking",
  };
};
