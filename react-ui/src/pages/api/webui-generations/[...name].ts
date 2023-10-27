// pages/api/images/[name].js

// Tell Next.js to pass in Node.js HTTP
export const config = {
  api: { externalResolver: true },
};

import express from "express";
import { webuiBasePath } from "../../../data/getVoicesData";
const handler = express();
const simpleLogger = (req, res, next) => {
  console.log(req.method, req.url);
  next();
};
// add logging middleware
handler.use(simpleLogger);

const serveFiles = express.static(webuiBasePath);
handler.use(["/api/webui-generations"], simpleLogger, serveFiles);

// express is just a function that takes (http.IncomingMessage, http.ServerResponse),
// which Next.js supports when externalResolver is enabled.
export default handler;
