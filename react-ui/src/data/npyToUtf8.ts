import { Iconv } from "iconv";
const convertUtf32leToUtf8 = new Iconv("UTF-32LE", "UTF-8");

export const npyToUtf8 = (item) => {
  const { data, shape } = item;
  const string = convertUtf32leToUtf8
    .convert(Buffer.from(data.buffer, data.byteOffset, data.byteLength))
    .toString("utf8");
  if (string.length !== shape[0])
    throw new Error(
      `Expected string length ${shape[0]}, but got ${string.length}`
    );
  return string;
};

if ("test" === process.argv[2]) {
  const npyList = {
    dtype: "<U1",
    data: Uint32Array.from([65, 66, 28450]),
    shape: [3],
    fortranOrder: false,
  };
  const y = npyToUtf8(npyList);
  if (y !== "AB漢") throw new Error("npyToUtf8 failed");
}
