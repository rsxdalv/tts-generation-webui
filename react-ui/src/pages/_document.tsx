import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          async
          src="https://analytics.umami.is/script.js"
          data-website-id="cc74b7dd-69e1-4a83-a422-898cbb1e1b0a"
        ></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
