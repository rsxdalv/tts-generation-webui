import React from "react";
import { commonBorder } from "./commonBorder";

export const ResetButton = <T extends {}>({
  params, setParams, initialParams,
}: {
  params: T;
  setParams: React.Dispatch<React.SetStateAction<T>>;
  initialParams: T;
}) => (
  <button
    className={commonBorder}
    onClick={() => setParams({
      ...params,
      ...initialParams,
    })}
  >
    Reset Parameters
  </button>
);
