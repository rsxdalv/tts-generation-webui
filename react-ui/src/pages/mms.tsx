import React from "react";
import { Template } from "../components/Template";
import { AudioOutput } from "../components/AudioComponents";
import { useMMSPage } from "../tabs/MMSParams";
import { HyperParameters } from "../components/HyperParameters";
import { MMSInputs } from "../components/MMSInputs";
import { GenerationHistorySimple } from "../components/GenerationHistory";

const MMSDescription = ({}) => (
  <details>
    <summary>Description</summary>
    <p>
      The MMS-TTS checkpoints are trained on lower-cased, un-punctuated text. By
      default, the VitsTokenizer normalizes the inputs by removing any casing
      and punctuation, to avoid passing out-of-vocabulary characters to the
      model. Hence, the model is agnostic to casing and punctuation, so these
      should be avoided in the text prompt.
    </p>
    <p>
      For certain languages with non-Roman alphabets, such as Arabic, Mandarin
      or Hindi, the uroman perl package is required to pre-process the text
      inputs to the Roman alphabet.
    </p>
    <p>Parameters:</p>
    <ul className="list-disc list-inside">
      <li>Speaking rate: Larger values give faster synthesised speech.</li>
      <li>
        Noise Scale: How random the speech prediction is. Larger values create
        more variation in the predicted speech.
      </li>
      <li>
        Noise Scale Duration: How random the duration prediction is. Larger
        values create more variation in the predicted durations.
      </li>
    </ul>
  </details>
);

const MMSPage = () => {
  const {
    historyData,
    setHistoryData,
    mmsParams,
    setMMSParams,
    consumer: mmsConsumer,
    handleChange,
    funcs,
  } = useMMSPage();

  return (
    <Template title="MMS">
      <div className="gap-y-4 p-4 flex w-full flex-col">
        <MMSDescription />
        <MMSInputs
          mmsParams={mmsParams}
          handleChange={handleChange}
          setMmsParams={setMMSParams}
        />

        <div className="flex flex-row gap-2">
          <AudioOutput
            audioOutput={historyData[0]?.audio}
            label="MMS Output"
            funcs={funcs}
            metadata={historyData[0]}
            filter={["sendToMMS"]}
          />
          <HyperParameters
            genParams={mmsParams}
            consumer={mmsConsumer}
            prefix="mms"
          />
        </div>

        <GenerationHistorySimple
          name="mms"
          setHistoryData={setHistoryData}
          historyData={historyData}
          funcs={funcs}
          nameKey={undefined}
          filter={["sendToMMS"]}
        />
      </div>
    </Template>
  );
};

export default MMSPage;
