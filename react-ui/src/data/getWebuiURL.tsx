import path from "path";
import { baseUrlPath } from "./baseUrlPath";

export const getWebuiURL = (...args: string[]) =>
  path
    .join(baseUrlPath, "api", "webui-generations", ...args)
    .split(path.sep)
    .join("/");
