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

const oggPath = path.join(webuiBasePath, "favorites");
const getOgg = () => fs.readdirSync(oggPath);

const npzPath = path.join(basePath, "voice-drafts");
const getNpzs = () => fs.readdirSync(npzPath);

const baseUrlPath = "";

export const getOggData = async () => {
  const ogg = getOgg();
  const oggData = ogg.map(async (ogg) => {
    const coreFilename = path.join(ogg, ogg + ".ogg");
    const filename = path.join(oggPath, coreFilename);
    const metadata = await parseFile(filename);
    try {
      const result = JSON.parse(
        // metadata?.common?.comment?.[0] || "{}"
        metadata?.native?.vorbis?.filter((x) => x.id === "DESCRIPTION")[0]
          .value || "{}"
      );
      result.semantic_prompt = null;
      result.coarse_prompt = null;
      return {
        ...result,
        filename: path
          .join(
            baseUrlPath,
            "api",
            "webui-generations",
            "favorites",
            coreFilename
          )
          .split(path.sep)
          .join("/"),
      };
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

const parseToNpzData = (buf: Buffer | ArrayBuffer) =>
  new AdmZip.default(buf instanceof Buffer ? buf : Buffer.from(buf))
    .getEntries()
    .filter((entry) => entry.name === "metadata.npy")
    .map((entry) => parseNpy(entry.getData().buffer))
    .map((entry) => npyToUtf8(entry))
    .map((entry) => JSON.parse(entry))[0];

export const getNpzData = async () =>
  getNpzs().map((npz) => ({
    ...parseToNpzData(fs.readFileSync(path.join(npzPath, npz))),
    filename: path
      .join(baseUrlPath, "voice-drafts", npz)
      .split(path.sep)
      .join("/"),
  }));
