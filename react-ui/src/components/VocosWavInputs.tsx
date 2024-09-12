import React from "react";
import { VocosParams } from "../tabs/VocosParams";

export const VocosWavInputs = ({
  vocosParams, handleChange,
}: {
  vocosParams: VocosParams;
  handleChange: (
    event: React.ChangeEvent<HTMLInputElement> |
      React.ChangeEvent<HTMLTextAreaElement> |
      React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => (
  <div className="gap-y-2">
    <label className="text-sm">Bandwidth in kbps:</label>
    <div className="flex flex-row gap-x-2">
      {["1.5", "3.0", "6.0", "12.0"].map((bandwidth) => (
        <div key={bandwidth} className="flex items-center">
          <input
            type="radio"
            name="bandwidth"
            id={bandwidth}
            value={bandwidth}
            checked={vocosParams.bandwidth === bandwidth}
            onChange={handleChange}
            className="cell" />
          <label className="ml-1" htmlFor={bandwidth}>
            {bandwidth}
          </label>
        </div>
      ))}
    </div>
  </div>
);
