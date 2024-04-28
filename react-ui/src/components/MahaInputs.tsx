import React from "react";
import { MahaParams, MahaResult, initialMahaParams } from "../tabs/MahaParams";

const commonBorder = "border border-gray-300 p-2 rounded";

const SeedInput = ({
  mahaParams,
  handleChange,
  setMahaParams,
  seed,
}: {
  mahaParams: MahaParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setMahaParams: React.Dispatch<React.SetStateAction<MahaParams>>;
  seed: number | string | undefined;
}) => (
  <div className="flex gap-x-2 items-center">
    <label className="text-sm">Seed:</label>
    <input
      type="number"
      name="seed"
      value={mahaParams.seed}
      onChange={handleChange}
      className={commonBorder}
    />
    <button
      className={commonBorder}
      onClick={() =>
        setMahaParams({
          ...mahaParams,
          seed: Number(seed) || -1,
        })
      }
    >
      Restore Last Seed
    </button>
    <button
      className={commonBorder}
      onClick={() =>
        setMahaParams({
          ...mahaParams,
          seed: -1,
        })
      }
    >
      Randomize
    </button>
  </div>
);

const deviceList = ["auto", "cpu", "cuda"];

const Speaker = ({
  mahaParams,
  handleChange,
}: {
  mahaParams: MahaParams;
  handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchOptions = async () => {
    setLoading(true);
    const response = await fetch("/api/gradio/maha_tts_refresh_voices", {
      method: "POST",
    });

    const result = await response.json();
    setOptions(result);
    setLoading(false);
  };

  const openVoices = async () => {
    await fetch("/api/gradio/tortoise_open_voices", {
      method: "POST",
    });
  };

  React.useEffect(() => {
    fetchOptions();
  }, []);

  const selected = mahaParams?.speaker_name;
  return (
    <div className="flex gap-2">
      <label className="text-sm">Speaker:</label>
      <select
        name="speaker_name"
        id="speaker_name"
        className="border border-gray-300 p-2 rounded text-black w-full"
        value={selected}
        onChange={handleChange}
      >
        {options
          // concat to ensure selected is at the top and present
          .filter((option) => option !== selected)
          .concat(selected)
          .map((bandwidth) => (
            <option key={bandwidth} value={bandwidth}>
              {bandwidth}
            </option>
          ))}
      </select>
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={openVoices}
      >
        Open
      </button>
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={fetchOptions}
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
};

export const MahaInputs = ({
  mahaParams,
  handleChange,
  setMahaParams,
  data,
}: {
  mahaParams: MahaParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
  setMahaParams: React.Dispatch<React.SetStateAction<MahaParams>>;
  data: MahaResult | null;
}) => {
  return (
    <div className="flex gap-x-6 w-full justify-center">
      <div className="flex flex-col gap-y-2 w-1/2">
        <label className="text-sm">Text:</label>
        <textarea
          name="maha_tts_input"
          value={mahaParams.maha_tts_input}
          onChange={handleChange}
          className={commonBorder}
          placeholder="Enter text here..."
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-y-2 w-1/2">
        <div className="flex gap-2 items-center">
          <label className="text-sm">Model Language:</label>
          <div className="flex gap-x-4">
            {[
              ["English", "Smolie-en"],
              ["Indian", "Smolie-in"],
            ].map(([visual_model_language, model_language]) => (
              <div key={visual_model_language} className="flex items-center">
                <input
                  type="radio"
                  name="model_language"
                  id={visual_model_language}
                  value={model_language}
                  checked={mahaParams.model_language === model_language}
                  onChange={(event) => {
                    console.log(event.target.value);
                    if (event.target.value === "Smolie-en") {
                      setMahaParams({
                        ...mahaParams,
                        maha_tts_language: "english",
                      });
                    }
                    handleChange(event);
                  }}
                  className={commonBorder}
                />
                <label
                  className="ml-1 select-none"
                  htmlFor={visual_model_language}
                >
                  {visual_model_language}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <label className="text-sm">TTS Language:</label>
          <div className="flex flex-wrap gap-x-4">
            {[
              "english",
              "tamil",
              "telugu",
              "punjabi",
              "marathi",
              "hindi",
              "gujarati",
              "bengali",
              "assamese",
            ].map((maha_tts_language) => (
              <div key={maha_tts_language} className="flex items-center">
                <input
                  type="radio"
                  name="maha_tts_language"
                  id={maha_tts_language}
                  value={maha_tts_language}
                  checked={mahaParams.maha_tts_language === maha_tts_language}
                  onChange={handleChange}
                  disabled={mahaParams.model_language !== "Smolie-in"}
                  className={commonBorder}
                />
                <label className="ml-1 select-none" htmlFor={maha_tts_language}>
                  {maha_tts_language.charAt(0).toUpperCase() +
                    maha_tts_language.slice(1)}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Speaker
          mahaParams={mahaParams}
          handleChange={handleChange}
        />

        <SeedInput
          mahaParams={mahaParams}
          handleChange={handleChange}
          setMahaParams={setMahaParams}
          seed={data?.metadata?.seed}
        />

        <div className="flex gap-2 items-center">
          <label className="text-sm">Device:</label>
          <div className="flex gap-x-4">
            {deviceList.map((device) => (
              <div key={device} className="flex items-center">
                <input
                  type="radio"
                  name="device"
                  id={device}
                  value={device}
                  checked={mahaParams.device === device}
                  onChange={handleChange}
                  className={commonBorder}
                />
                <label className="ml-1 select-none" htmlFor={device}>
                  {device}
                </label>
              </div>
            ))}
          </div>
        </div>

        <button
          className={commonBorder}
          onClick={() =>
            setMahaParams({
              ...mahaParams,
              ...initialMahaParams,
            })
          }
        >
          Reset Parameters
        </button>
      </div>
    </div>
  );
};
