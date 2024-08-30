import React from "react";
import { Progress } from "./Progress";
import useLocalStorage from "../hooks/useLocalStorage";
import { extractTexts, initialHyperParams } from "../data/hyperParamsUtils";
import { applySeed } from "../data/applySeed";
import { useInterrupt } from "../hooks/useInterrupt";

const getParams = <T extends { seed: number }>(
  texts: string[],
  iterations: number,
  params: T
) =>
  Array(iterations)
    .fill(0)
    .flatMap((_, iteration) =>
      texts.map((text) => ({
        ...params,
        text,
        seed: params.seed + iteration,
      }))
    );

const progressMiddleware = (setProgress, max) =>
  function* (next) {
    setProgress({ current: 0, max });
    for (const params of next) {
      yield params;
      setProgress(({ current, max }) => ({
        current: current + 1,
        max,
        params,
      }));
    }
    setProgress({ current: 0, max: 0 });
  };

const interruptionMiddleware = (interrupted) =>
  function* (next) {
    for (const params of next) {
      if (interrupted.current) {
        break;
      }
      yield params;
    }
  };

const logMiddleware = () =>
  function* (next) {
    for (const params of next) {
      console.log("Before generation", params);
      yield params;
      console.log("After generation", params);
    }
  };

const pipe =
  (...middlewares) =>
  (iterator) =>
    middlewares.reduceRight((next, middleware) => middleware(next), iterator);

const finalPipe = async (
  consumerFn,
  sourceIterator,
  ...iteratorMiddlewares
) => {
  for (const params of pipe(...iteratorMiddlewares)(sourceIterator)) {
    await consumerFn(params);
  }
};

const batchRunner2 = (interrupted, consume, paramsList, setProgress) =>
  finalPipe(
    consume,
    paramsList,
    progressMiddleware(setProgress, paramsList.length),
    interruptionMiddleware(interrupted),
    logMiddleware()
  );

export const HyperParameters = ({
  consumer,
  prefix,
  genParams,
}: {
  genParams: { text: string; seed: number; use_random_seed?: boolean };
  consumer: (x: any) => Promise<any>;
  prefix?: string;
}) => {
  const [params, setParams] = useLocalStorage<typeof initialHyperParams>(
    prefix + "HyperParams",
    initialHyperParams
  );
  const { interrupted, resetInterrupt, interrupt } = useInterrupt();
  const [progress, setProgress] = React.useState({ current: 0, max: 0 });

  const generate = resetInterrupt(() =>
    batchRunner2(
      interrupted,
      consumer,
      getParams(
        extractTexts(genParams.text, params),
        params.iterations,
        applySeed(genParams)
      ),
      setProgress
    )
  );

  return (
    <div className="flex flex-col gap-y-2 border border-gray-300 p-2 rounded">
      <label className="text-base">Generation Controls:</label>
      <div className="flex gap-x-2 items-center">
        <label className="text-sm">Iterations:</label>
        <input
          type="number"
          name="iterations"
          value={params.iterations}
          onChange={(event) => {
            setParams({
              ...params,
              iterations: Number(event.target.value),
            });
          }}
          className="border border-gray-300 p-2 rounded"
          min="1"
          max="10"
          step="1"
        />
      </div>
      <div className="flex gap-x-2 items-center">
        <div className="text-sm">Each line as a separate prompt:</div>
        <input
          type="checkbox"
          name="splitByLines"
          checked={params.splitByLines}
          onChange={(event) => {
            setParams({
              ...params,
              splitByLines: event.target.checked,
            });
          }}
          className="border border-gray-300 p-2 rounded"
        />
      </div>
      <Progress progress={progress.current} progressMax={progress.max} />
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={interrupt}
      >
        {interrupted ? "Interrupted..." : "Interrupt"}
      </button>
      <button className="border border-gray-300 p-2 rounded" onClick={generate}>
        Generate
      </button>
    </div>
  );
};
