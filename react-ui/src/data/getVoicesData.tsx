import fs from "fs";
import path from "path";
import { parseFile } from "music-metadata";
import { parseMetadataDate } from "../components/parseMetadataDate";
import * as AdmZip from "adm-zip";
import { parseNpy } from "./npz-parsing";
import { npyToUtf8 } from "./npyToUtf8";

const __next__base__dirname = __dirname.split(".next")[0];
const basePath = path.join(__next__base__dirname, "public");
export const webuiBasePath = path.join(__next__base__dirname, "..");

const getWebuiPath = (dir: string) => path.join(webuiBasePath, dir);

const oggPath = getWebuiPath("favorites");
const getOgg = () => fs.readdirSync(oggPath);

const npzPath = path.join(basePath, "voice-drafts");
const npzPathWebui = getWebuiPath("voices");
const getNpzs = (dir: string = npzPath) => fs.readdirSync(dir);

const baseUrlPath = "";

export const getOggData = async (collection = "favorites") => {
  const ogg = getOgg();
  // TODO - filter tortoise?
  const oggData = ogg.map(async (dirname) => {
    const coreFilename = path.join(dirname, dirname + ".ogg");
    const filename = path.join(oggPath, coreFilename);
    const metadata = await parseFile(filename);
    try {
      const result = JSON.parse(
        // metadata?.common?.comment?.[0] || "{}"
        metadata?.native?.vorbis?.filter((x) => x.id === "DESCRIPTION")[0]
          .value || "{}"
      );
      return generateResult(result, collection, coreFilename, dirname);
    } catch (error) {
      console.error(error);
      console.log("Error parsing metadata for file: " + filename);
      try {
        console.log(
          "metadata?.native?.vorbis?.filter((x) => x.id === 'DESCRIPTION')[0].value: " +
            metadata?.native?.vorbis?.filter((x) => x.id === "DESCRIPTION")[0]
              .value
        );
      } catch (error) {
        console.error(error);
      }
      return null;
    }
  });

  const oggDataParsed = (await Promise.all(oggData))
    .filter((x) => x !== null)
    .filter((x) => x.date);
  // Sort by date
  oggDataParsed.sort((a, b) => {
    return (
      parseMetadataDate(b.date).getTime() - parseMetadataDate(a.date).getTime()
    );
  });
  return oggDataParsed;
};

const parseToNpzData = (buf: Buffer | ArrayBuffer) => {
  try {
    return new AdmZip.default(buf instanceof Buffer ? buf : Buffer.from(buf))
      .getEntries()
      .filter((entry) => entry.name === "metadata.npy")
      .map((entry) => parseNpy(entry.getData().buffer))
      .map((entry) => npyToUtf8(entry))
      .map((entry) => JSON.parse(entry))[0];
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getNpzData = async () =>
  getNpzs().map((npz) => ({
    ...parseToNpzData(fs.readFileSync(path.join(npzPath, npz))),
    filename: path
      .join(baseUrlPath, "voice-drafts", npz)
      .split(path.sep)
      .join("/"),
  }));

export const getNpzDataSimpleVoices = async () =>
  getNpzs(npzPathWebui)
    .filter((file) => file.endsWith(".npz"))
    .map((npz) => ({
      ...parseToNpzData(fs.readFileSync(path.join(npzPathWebui, npz))),
      filename: path.join(baseUrlPath, "voices", npz).split(path.sep).join("/"),
      url: getWebuiURL("voices", npz),
    }));

export const getDataFromJSON = async (collection = "outputs") => {
  const basePath = getWebuiPath(collection);
  const dirs = fs.readdirSync(basePath);
  const oggData = dirs.map(async (dirname) => {
    const coreFilename = path.join(dirname, dirname + ".ogg");
    const jsonFilename = path.join(basePath, dirname, dirname + ".json");
    try {
      const json = await fs.promises.readFile(jsonFilename, "utf-8");
      const result = JSON.parse(json);
      return generateResult(result, collection, coreFilename, dirname);
    } catch (error) {
      console.error(error);
      console.log("Error parsing metadata for file: " + jsonFilename);
      return null;
    }
  });

  const oggDataParsed = (await Promise.all(oggData))
    .filter((x) => x !== null)
    .filter((x) => x.date);
  // Sort by date
  oggDataParsed.sort((a, b) => {
    return (
      parseMetadataDate(b.date).getTime() - parseMetadataDate(a.date).getTime()
    );
  });
  return oggDataParsed;
};

const getWebuiURL = (...args: string[]) =>
  path
    .join(baseUrlPath, "api", "webui-generations", ...args)
    .split(path.sep)
    .join("/");

const generateResult = (
  result: any,
  collection: string,
  coreFilename: string,
  dirname: string
) => ({
  ...result,
  semantic_prompt: null,
  coarse_prompt: null,

  filename: getWebuiURL(collection, coreFilename),

  history_bundle_name_data: path.join(collection, dirname),
  api_filename: path.join(collection, coreFilename),
});
