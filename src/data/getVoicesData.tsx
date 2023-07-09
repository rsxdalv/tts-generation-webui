import fs from "fs";
import path from "path";
import { parseFile } from "music-metadata";
import { parseMetadataDate } from "../components/parseMetadataDate";
import * as AdmZip from "adm-zip";
import { parseNpy } from "./npz-parsing";
import { npyToUtf8 } from "./npyToUtf8";

const basePath = path.join(__dirname, "../../../public");
// const basePath = path.join(__dirname, "../../public");
const voicesPath = path.join(basePath, "voices");
const getVoices = () => fs.readdirSync(voicesPath);

const generationsPath = path.join(basePath, "generations");
const getGenerations = () => fs.readdirSync(generationsPath);

const oggPath = path.join(basePath, "musicgen-ogg");
const getOgg = () => fs.readdirSync(oggPath);

const npzPath = path.join(basePath, "voice-drafts");
const getNpzs = () => fs.readdirSync(npzPath);

const baseUrlPath = process.env.BASE_URL_PATH || "/tts-generation-webui";
// const baseUrlPath = "";

// For each voice get voice.json file and parse it
// Return array of objects
// --------------------------------------------------
export const getVoicesData = () => {
  const voices = getVoices();
  const voicesData = voices.map((voice) => {
    const voiceData = fs.readFileSync(
      path.join(voicesPath, voice, "voice.json"),
      "utf8"
    );
    return JSON.parse(voiceData);
  });
  // include the directory name in the object
  voicesData.forEach((voice, index) => {
    voice.directory = voices[index];
  });
  // join path for image, audio and download keys with directory
  voicesData.forEach((voice) => {
    const fixPath = (key: string) => {
      if (voice[key]) {
        voice[key] = path
          .join(baseUrlPath, "voices", voice.directory, voice[key])
          .split(path.sep)
          .join("/");
      }
    };
    fixPath("image");
    fixPath("audio");
    fixPath("download");
  });
  return voicesData;
};

export const getMusicGenOggData = async () => {
  const ogg = getOgg();
  const oggData = ogg.map(async (ogg) => {
    const filename = path.join(oggPath, ogg);
    const metadata = await parseFile(filename);
    try {
      return {
        ...JSON.parse(
          // metadata?.common?.comment?.[0] || "{}"
          metadata?.native?.vorbis?.filter((x) => x.id === "DESCRIPTION")[0]
            .value || "{}"
        ),
        filename: path
          .join(baseUrlPath, "musicgen-ogg", ogg)
          .split(path.sep)
          .join("/"),
      };
    } catch (error) {
      console.error(error);
      console.log("Error parsing metadata for file: " + filename);
      console.log(
        "metadata?.native?.vorbis?.filter((x) => x.id === 'DESCRIPTION')[0].value: " +
          metadata?.native?.vorbis?.filter((x) => x.id === "DESCRIPTION")[0]
            .value
      );
      return {};
    }
  });
  const oggDataParsed = await Promise.all(oggData);
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
// .sort((a: any, b: any) => {
//   return (
//     parseMetadataDate(b.date).getTime() -
//     parseMetadataDate(a.date).getTime()
//   );
// }

// Save voices data to json file
// --------------------------------------------------
const saveVoicesData = () => {
  const voicesData = getVoicesData();
  const voicesDataJSON = JSON.stringify(voicesData, undefined, 2);
  fs.writeFileSync(
    path.join(__dirname, "./src/data/voices.json"),
    voicesDataJSON
  );
};
