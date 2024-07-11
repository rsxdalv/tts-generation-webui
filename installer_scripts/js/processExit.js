// declare process
// declare var process: {
//   stdin: any;
//   stdout(stdout: any, arg1: number, arg2: number): unknown;
//   env: {
//     [key: string]: string;
//   };
//   exit(code?: number): void;
// };

// export const processExit = (code) => {
const processExit = (code) => {
  // endConnection(() => {
  process.exit(code);
  // });
};

exports.processExit = processExit;
