import React from "react";
import { MMSParams, MMSResult, initialMMSParams } from "../tabs/MMSParams";
import { HandleChange } from "../types/HandleChange";
import { PromptTextArea } from "./PromptTextArea";
import { GenericSlider } from "./GenericSlider";
import { MMS_LANGUAGE_DATA } from "./MMS_LANGUAGE_DATA";

const commonBorder = "border border-gray-300 p-2 rounded";

const ResetButton = <T extends {}>({
  params,
  setParams,
  initialParams,
}: {
  params: T;
  setParams: React.Dispatch<React.SetStateAction<T>>;
  initialParams: T;
}) => (
  <button
    className={commonBorder}
    onClick={() =>
      setParams({
        ...params,
        ...initialParams,
      })
    }
  >
    Reset Parameters
  </button>
);

export const MMSInputs = ({
  mmsParams,
  handleChange,
  setMmsParams,
}: {
  mmsParams: MMSParams;
  handleChange: HandleChange;
  setMmsParams: React.Dispatch<React.SetStateAction<MMSParams>>;
  data: MMSResult | null;
}) => (
  <div className="flex gap-x-6 w-full justify-center">
    <div className="flex flex-col gap-y-2 w-1/2">
      <PromptTextArea
        params={mmsParams}
        handleChange={handleChange}
        label="Text"
        name="text"
      />
    </div>

    <div className="flex flex-col gap-y-2 w-1/2">
      <div className="flex gap-2 items-center">
        <label className="text-sm">Language:</label>
        <select
          name="language"
          value={mmsParams.language}
          onChange={handleChange}
          className={commonBorder}
        >
          {MMS_LANGUAGE_DATA.map(([visual_model_language, language]) => (
            <option key={visual_model_language} value={language}>
              {visual_model_language}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-row gap-2">
        <GenericSlider
          params={mmsParams}
          handleChange={handleChange}
          label="Speaking Rate"
          format={(x) => x.toFixed(1)}
          name="speaking_rate"
          min="0.1"
          max="10.0"
          step="0.1"
        />

        <GenericSlider
          params={mmsParams}
          handleChange={handleChange}
          label="Noise Scale"
          format={(x) => x.toFixed(2)}
          name="noise_scale"
          min="-2.5"
          max="2.5"
          step="0.05"
        />

        <GenericSlider
          params={mmsParams}
          handleChange={handleChange}
          label="Noise Scale Duration"
          format={(x) => x.toFixed(2)}
          name="noise_scale_duration"
          min="-1.0"
          max="2"
          step="0.05"
        />
      </div>

      <ResetButton
        params={mmsParams}
        setParams={setMmsParams}
        initialParams={initialMMSParams}
      />
    </div>
  </div>
);
