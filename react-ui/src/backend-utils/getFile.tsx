import fs from "fs";
import path from "path";

export const getFile = (file: string) =>
  file
    ? file.startsWith("http") || file.startsWith("data")
      ? readFromURL(file)
      : readFromDisk(file)
    : null;

const readFromDisk = (file: string) =>
  new Promise((resolve, reject) => {
    fs.readFile(path.join(process.cwd(), "public", file), (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });

const readFromURL = (file: string) => fetch(file).then((r) => r.blob());
