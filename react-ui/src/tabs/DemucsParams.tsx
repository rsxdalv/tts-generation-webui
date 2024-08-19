import useLocalStorage, {
  readLocalStorage,
  updateLocalStorageWithFunction,
} from "../hooks/useLocalStorage";
import router from "next/router";
import { GradioFile } from "../types/GradioFile";
import { splitWithDemucs } from "../functions/splitWithDemucs";
import { useHistory } from "../hooks/useHistory";

export type DemucsParams = {
  file?: string;
};

export const initialState: DemucsParams = {
  file: "https://www.mfiles.co.uk/mp3-downloads/gs-cd-track2.mp3",
};

export type DemucsGradioFile = GradioFile & {
  type_name?: string;
};

type DemucsResult = {
  audio: DemucsGradioFile;
  typeName: string;
};

const typeNames = ["drums", "bass", "other", "vocals"];

const addTypeNamesToAudioOutputs = (
  audioOutputs: DemucsGradioFile[],
  typeNames: string[]
) =>
  audioOutputs.map((audioOutput, index) => ({
    ...audioOutput,
    type_name: typeNames[index],
  }));

export const demucsId = "demucs-tab";

export const sendToDemucs = (file?: string) => {
  if (!file) return;
  updateLocalStorageWithFunction(
    demucsId,
    (demucsParams: DemucsParams = initialState) =>
      ({ ...demucsParams, file } as DemucsParams)
  );
  router.push("/demucs");
};

export const useDemucsParams = () =>
  useLocalStorage<DemucsParams>(demucsId, initialState);

export const useDemucsResults = () =>
  useLocalStorage<DemucsParams | null>(demucsId + ".output", null);

export const getDemucsParams = (): DemucsParams =>
  readLocalStorage(demucsId) ?? initialState;

export const useDemucsPage = () => {
  const [demucsParams, setDemucsParams] = useDemucsParams();

  const [historyData, setHistoryData] = useHistory<DemucsResult>("demucs");

  const consumer = async (params: DemucsParams) => {
    const result = await splitWithDemucs(params);
    const sampleWithTypeNames = addTypeNamesToAudioOutputs(result, typeNames);
    const data = typeNames.map((typeName) => ({
      audio: sampleWithTypeNames?.find((item) => item.type_name === typeName)!,
      typeName,
    }));
    setHistoryData((historyData) => [...data, ...historyData]);
  };

  const funcs = {
    useAsInput: (audio?: string) => {
      if (!audio) return;
      setDemucsParams({ ...demucsParams, file: audio });
    },
  };

  return {
    demucsParams,
    setDemucsParams,
    historyData,
    setHistoryData,
    consumer,
    funcs,
  };
};
