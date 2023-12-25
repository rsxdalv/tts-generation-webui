import React from "react";
import { Template } from "../components/Template";
import useLocalStorage from "../hooks/useLocalStorage";
import { AudioInput, AudioOutput } from "../components/AudioComponents";
import Head from "next/head";
import {
  BarkGenerationParams,
  barkGenerationId,
  initialState,
} from "../tabs/BarkGenerationParams";
import { GradioFile } from "../types/GradioFile";

type Result = {
  audio: GradioFile;
  image: string;
  save_button: Object;
  continue_button: Object;
  buttons_row: Object;
  npz: string;
  seed: null;
  json_text: {
    _version: string;
    _hash_version: string;
    _type: string;
    is_big_semantic_model: boolean;
    is_big_coarse_model: boolean;
    is_big_fine_model: boolean;
    prompt: string;
    language: string;
    speaker_id: string;
    hash: string;
    history_prompt: string;
    history_prompt_npz: string;
    history_hash: string;
    text_temp: number;
    waveform_temp: number;
    date: string;
    seed: string;
    semantic_prompt: string;
    coarse_prompt: string;
  };
  history_bundle_name_data: string;
};

const initialHistory = []; // prevent infinite loop
const BarkGenerationPage = () => {
  const [historyData, setHistoryData] = useLocalStorage<Result[]>(
    "barkGenerationHistory",
    initialHistory
  );
  const [data, setData] = useLocalStorage<Result | null>(
    "barkGenerationOutput",
    null
  );
  const [barkGenerationParams, setBarkVoiceGenerationParams] =
    useLocalStorage<BarkGenerationParams>(barkGenerationId, initialState);
  // loading state
  const [loading, setLoading] = React.useState<boolean>(false);

  async function barkGeneration() {
    setLoading(true);
    const response = await fetch("/api/gradio/bark", {
      method: "POST",
      body: JSON.stringify(barkGenerationParams),
    });

    const result = await response.json();
    setData(result);
    setHistoryData((historyData) => [result, ...historyData]);
    setLoading(false);
  }

  const useAsHistory = (data?: Result) => {
    const npz = data?.npz;
    if (!npz) return;
    setBarkVoiceGenerationParams({
      ...barkGenerationParams,
      old_generation_dropdown: npz,
    });
  };

  const useAsHistoryPromptSemantic = (data?: Result) => {
    const npz = data?.npz;
    if (!npz) return;
    setBarkVoiceGenerationParams({
      ...barkGenerationParams,
      history_prompt_semantic_dropdown: npz,
    });
  };

  const useSeed = (data?: Result) => {
    const seed_input = data?.json_text?.seed;
    console.log("useSeed");
    console.log(seed_input);
    console.log(data);
    console.log(data?.json_text);
    console.log(data?.json_text?.seed);
    if (!seed_input) return;
    setBarkVoiceGenerationParams({
      ...barkGenerationParams,
      seed_input,
    });
  };

  const favorite = async (data?: Result) => {
    const history_bundle_name_data = data?.history_bundle_name_data;
    if (!history_bundle_name_data) return;
    const response = await fetch("/api/gradio/bark_favorite", {
      method: "POST",
      body: JSON.stringify({
        history_bundle_name_data,
      }),
    });
    const result = await response.json();
    console.log(result);
  };

  const funcs = [useAsHistory, useAsHistoryPromptSemantic, useSeed, favorite];

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    setBarkVoiceGenerationParams({
      ...barkGenerationParams,
      [name]:
        type === "number" || type === "range"
          ? Number(value)
          : type === "checkbox"
          ? (event.target as HTMLInputElement).checked // type assertion
          : value,
    });
  };

  return (
    <Template>
      <Head>
        <title>Bark - TTS Generation Webui</title>
      </Head>
      <div className="flex w-full flex-col">
        <Inputs
          barkGenerationParams={barkGenerationParams}
          setBarkVoiceGenerationParams={setBarkVoiceGenerationParams}
          handleChange={handleChange}
          data={data}
        />
        <div className="flex flex-col space-y-4">
          <button
            className="border border-gray-300 p-2 rounded hover:bg-gray-100"
            onClick={barkGeneration}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
          <AudioOutput
            audioOutput={data?.audio}
            label="Bark Output"
            funcs={funcs}
            metadata={data}
            filter={["sendToBark", "sendToBarkVoiceGeneration"]}
          />
        </div>
        <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
          <label className="text-sm">History:</label>
          <button
            className="border border-gray-300 p-2 rounded"
            onClick={() => {
              setHistoryData([]);
            }}
          >
            Clear History
          </button>
          <div className="flex flex-col space-y-2">
            {historyData &&
              historyData.map((item, index) => (
                <AudioOutput
                  key={index}
                  audioOutput={item.audio}
                  label={`${item?.json_text?.date}`}
                  funcs={funcs}
                  metadata={item}
                  filter={["sendToBark", "sendToBarkVoiceGeneration"]}
                />
              ))}
          </div>
        </div>
      </div>
      {/* <pre>{JSON.stringify(barkGenerationParams, null, 2)}</pre> */}
    </Template>
  );
};

export default BarkGenerationPage;

function Inputs({
  barkGenerationParams,
  setBarkVoiceGenerationParams,
  handleChange,
  data,
}: {
  barkGenerationParams: BarkGenerationParams;
  setBarkVoiceGenerationParams: (
    barkGenerationParams: BarkGenerationParams
  ) => void;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
  data: Result | null;
}) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="space-y-2">
        {/* {HistoryPromptVoiceSetting({ barkGenerationParams, handleChange })} */}
        <HistoryPromptVoiceSetting
          barkGenerationParams={barkGenerationParams}
          handleChange={handleChange}
        />
      </div>
      <div className="flex flex-row space-x-2">
        <div className="space-y-2 flex flex-col w-1/2">
          {barkGenerationParams.history_setting === "or Use a voice:" && (
            <div className="flex flex-col border border-gray-300 p-2 rounded">
              <h2 className="text-md">Voice:</h2>
              <Language
                barkGenerationParams={barkGenerationParams}
                handleChange={handleChange}
              />
              <SpeakerID
                barkGenerationParams={barkGenerationParams}
                handleChange={handleChange}
              />
              <UseV2
                barkGenerationParams={barkGenerationParams}
                handleChange={handleChange}
              />
            </div>
          )}
          {barkGenerationParams.history_setting ===
            "or Use old generation as history:" && (
            <div className="flex flex-col border border-gray-300 p-2 rounded">
              <OldGeneration
                barkGenerationParams={barkGenerationParams}
                handleChange={handleChange}
              />
              <HistoryPromptSemantic
                barkGenerationParams={barkGenerationParams}
                handleChange={handleChange}
              />
            </div>
          )}
        </div>
        <div className="space-y-2 w-1/2">
          {/* {PromptType({ barkGenerationParams, handleChange })} */}
          <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
            <PromptType
              barkGenerationParams={barkGenerationParams}
              handleChange={handleChange}
            />
            <ForEachSubsequentGeneration
              barkGenerationParams={barkGenerationParams}
              handleChange={handleChange}
            />
            <TextTemp
              barkGenerationParams={barkGenerationParams}
              handleChange={handleChange}
            />
            <WaveformTemp
              barkGenerationParams={barkGenerationParams}
              handleChange={handleChange}
            />
          </div>
          <Seed
            barkGenerationParams={barkGenerationParams}
            setBarkVoiceGenerationParams={setBarkVoiceGenerationParams}
            handleChange={handleChange}
            lastSeed={data?.json_text?.seed}
          />
        </div>
      </div>
      <BurnInPrompt
        barkGenerationParams={barkGenerationParams}
        handleChange={handleChange}
      />
      <Prompt
        barkGenerationParams={barkGenerationParams}
        handleChange={handleChange}
      />
    </div>
  );
}

const ForEachSubsequentGeneration = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div>
      <label className="text-sm">For each subsequent generation:</label>
      <div className="flex flex-col space-y-2">
        {[
          "Use old generation as history",
          "or Use history prompt setting",
          "or Clear history",
        ].map((subsequentSetting) => (
          <div key={subsequentSetting} className="flex items-center">
            <input
              type="radio"
              name="long_prompt_history_radio"
              id={subsequentSetting}
              value={subsequentSetting}
              checked={
                barkGenerationParams.long_prompt_history_radio ===
                subsequentSetting
              }
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded"
            />
            <label className="ml-1" htmlFor={subsequentSetting}>
              {subsequentSetting}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const randomSeed = () => {
  return Math.floor(Math.random() * 2 ** 32);
};

const Seed = ({
  barkGenerationParams,
  setBarkVoiceGenerationParams,
  handleChange,
  lastSeed,
}: {
  barkGenerationParams: BarkGenerationParams;
  setBarkVoiceGenerationParams: (
    barkGenerationParams: BarkGenerationParams
  ) => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  lastSeed?: string;
}) => {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm">Seed:</label>
      <input
        type="text"
        name="seed_input"
        value={barkGenerationParams.seed_input}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded"
      />
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={() => {
          setBarkVoiceGenerationParams({
            ...barkGenerationParams,
            seed_input: lastSeed ?? "-1",
          });
        }}
      >
        Restore Last
      </button>
      <button
        className="border border-gray-300 p-2 rounded"
        onClick={() => {
          setBarkVoiceGenerationParams({
            ...barkGenerationParams,
            // seed_input: randomSeed().toString(),
            seed_input: "-1",
          });
        }}
      >
        Randomize
      </button>
    </div>
  );
};

// generic old generation dropdown for both OldGeneration and HistoryPromptSemantic
const OldGenerationDropdown = ({
  barkGenerationParams,
  handleChange,
  name,
  label,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  name: string;
  label: string;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    (async () => {
      const response = await fetch(
        "/api/gradio/reload_old_generation_dropdown",
        {
          method: "POST",
        }
      );

      const result = await response.json();
      setOptions(result);
    })();
  }, []);

  const selected = barkGenerationParams?.[name];
  return (
    <div>
      <label className="text-sm">{label}:</label>
      <select
        name={name}
        id={name}
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
        onClick={() => {
          (async () => {
            const response = await fetch(
              "/api/gradio/reload_old_generation_dropdown",
              {
                method: "POST",
              }
            );

            const result = await response.json();
            setOptions(result);
          })();
        }}
      >
        Refresh
      </button>
    </div>
  );
};

const OldGeneration = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) => {
  return (
    <OldGenerationDropdown
      barkGenerationParams={barkGenerationParams}
      handleChange={handleChange}
      name="old_generation_dropdown"
      label="Old generation"
    />
  );
};

const HistoryPromptSemantic = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) => {
  return (
    <OldGenerationDropdown
      barkGenerationParams={barkGenerationParams}
      handleChange={handleChange}
      name="history_prompt_semantic_dropdown"
      label="History prompt semantic"
    />
  );
};

const HistoryPromptVoiceSetting = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => {
  return (
    <div className="flex flex-col space-y-2 border border-gray-300 p-2 rounded">
      <label className="text-sm">History Prompt (voice) setting:</label>
      <div className="flex flex-row space-x-2">
        {[
          "Empty history",
          "or Use a voice:",
          "or Use old generation as history:",
        ].map((model) => (
          <div key={model} className="flex items-center">
            <input
              type="radio"
              name="history_setting"
              id={model}
              value={model}
              checked={barkGenerationParams.history_setting === model}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded"
            />
            <label className="ml-1" htmlFor={model}>
              {model}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const PromptType = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => {
  return (
    <div>
      <label className="text-sm">Prompt type:</label>
      <div className="flex flex-row space-x-2">
        {["Short prompt (<15s)", "Split prompt by lines"].map((promptType) => (
          <div key={promptType} className="flex items-center">
            <input
              type="radio"
              name="long_prompt_radio"
              id={promptType}
              value={promptType}
              checked={barkGenerationParams.long_prompt_radio === promptType}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded"
            />
            <label className="ml-1" htmlFor={promptType}>
              {promptType}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const Language = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <>
      <label className="text-sm">Language:</label>
      <div className="flex flex-row gap-x-2 flex-wrap">
        {[
          "English",
          "German",
          "Spanish",
          "French",
          "Hindi",
          "Italian",
          "Japanese",
          "Korean",
          "Polish",
          "Portuguese",
          "Russian",
          "Turkish",
          "Chinese",
        ].map((model) => (
          <div key={model} className="flex items-center">
            <input
              type="radio"
              name="languageRadio"
              id={model}
              value={model}
              checked={barkGenerationParams.languageRadio === model}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded"
            />
            <label className="ml-1" htmlFor={model}>
              {model}
            </label>
          </div>
        ))}
      </div>
    </>
  );
};

const GenericPrompt = ({
  barkGenerationParams,
  handleChange,
  label,
  name,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label: string;
  name: string;
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm">{label}:</label>
      <textarea
        name={name}
        value={barkGenerationParams[name]}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded resize-none"
        placeholder="Enter text here..."
        rows={3}
      />
    </div>
  );
};

const BurnInPrompt = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) => {
  return (
    <GenericPrompt
      barkGenerationParams={barkGenerationParams}
      handleChange={handleChange}
      label="Burn In Prompt (Optional)"
      name="burn_in_prompt"
    />
  );
};

const Prompt = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) => {
  return (
    <GenericPrompt
      barkGenerationParams={barkGenerationParams}
      handleChange={handleChange}
      label="Prompt"
      name="prompt"
    />
  );
};

const GenericTemp = ({
  barkGenerationParams,
  handleChange,
  label,
  name,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  name: string;
}) => {
  return (
    <div className="flex flex-col border border-gray-300 p-2 rounded">
      <label className="text-sm">
        {label}: {barkGenerationParams[name]}
      </label>
      <input
        type="range"
        name={name}
        value={barkGenerationParams[name]}
        onChange={handleChange}
        className="border border-gray-300 py-2 rounded"
        min="0"
        max="1.2"
        step="0.01"
      />
    </div>
  );
};

const TextTemp = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <GenericTemp
      barkGenerationParams={barkGenerationParams}
      handleChange={handleChange}
      label="Text temperature"
      name="text_temp"
    />
  );
};

const WaveformTemp = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <GenericTemp
      barkGenerationParams={barkGenerationParams}
      handleChange={handleChange}
      label="Waveform temperature"
      name="waveform_temp"
    />
  );
};

const UseV2 = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm">Use V2:</label>
      <input
        type="checkbox"
        name="useV2"
        id="useV2"
        checked={barkGenerationParams.useV2}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded"
      />
    </div>
  );
};

const SpeakerID = ({
  barkGenerationParams,
  handleChange,
}: {
  barkGenerationParams: BarkGenerationParams;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <>
      <label className="text-sm">Speaker ID:</label>
      <div className="flex flex-row space-x-2">
        {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((model) => (
          <div key={model} className="flex items-center">
            <input
              type="radio"
              name="speakerIdRadio"
              id={model}
              value={model}
              checked={barkGenerationParams.speakerIdRadio === model}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded"
            />
            <label className="ml-1" htmlFor={model}>
              {model}
            </label>
          </div>
        ))}
      </div>
    </>
  );
};
