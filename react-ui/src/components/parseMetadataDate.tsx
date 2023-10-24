// 2023-05-27_13-06-13
export const parseMetadataDate = (date: string) => {
  const [year, month, day, hour, minute, second] = date
    .split(/[-_]/)
    .map((x) => parseInt(x));
  return new Date(year, month - 1, day, hour, minute, second);
};
