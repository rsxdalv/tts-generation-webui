import AuthorIcon from "@material-design-icons/svg/filled/person.svg";
import DownloadIcon from "@material-design-icons/svg/filled/download.svg";
import WomanIcon from "@material-design-icons/svg/filled/female.svg";
import ManIcon from "@material-design-icons/svg/filled/male.svg";
import OtherIcon from "@material-design-icons/svg/filled/alt_route.svg";
import PlayIcon from "@material-design-icons/svg/filled/play_arrow.svg";
import PauseIcon from "@material-design-icons/svg/filled/pause.svg";
import AddIcon from "@material-design-icons/svg/filled/add.svg";
import React, { useEffect, useRef, useState } from "react";
import { Flag } from "./Flag";
import { Voice } from "../types/Voice";
import { useFavorites, saveOrDeleteFromFavorites } from "./FavoritesProvider";
import { useLocalVotes, useVotes } from "./VotesProvider";
import { Vote } from "./Vote";
import { MUIIcon } from "./mini/MUIIcon";
import { GenerationRaw } from "../types/Generation";
import { parseMetadataDate } from "./parseMetadataDate";
import { Metadata } from "./Metadata";

export const CardBig = ({
  voice: { name, audio, download, image, tags, language, author, gender },
}: {
  voice: Voice;
}) => {
  const [votes, setVote] = useVotes();
  const voteCount = votes[download] || 0;
  const [localVotes, setLocalVotes] = useLocalVotes();
  const vote = localVotes[download] || 0;
  const setVoteWithLocalStorage = (newVote: number) => {
    setVote(download, newVote - vote);
    setLocalVotes({ ...localVotes, [download]: newVote });
  };
  return (
    <div className="flex flex-col items-center justify-start w-full max-w-md py-4 px-6 bg-white rounded shadow-lg">
      <div className="flex flex-col space-y-4 w-full h-full justify-between">
        <div className="flex items-center w-full gap-x-2">
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          <div className="ml-auto" />
          <Author author={author} />
          <SaveToFavorites download={download} />
          <Gender gender={gender} />
          <Flag language={language} />
        </div>
        <div className="flex w-full space-x-4">
          <img
            className="w-24 h-24 rounded select-none"
            src={image}
            width={96}
            height={96}
          />
          <Tags tags={tags} />
        </div>
        <div className="flex w-full justify-between">
          <AudioPlayer audio={audio} />
          <Vote
            vote={vote}
            setVote={setVoteWithLocalStorage}
            voteCount={voteCount}
          />
          <Download download={download} />
        </div>
      </div>
    </div>
  );
};

export const CardGeneration = ({
  generation: { prompt, language, history_hash, filename, date, ...rest },
}: {
  generation: GenerationRaw;
}) => {
  // Detect if prompt is Japanese
  const isJapanese = prompt.match(/[\u3040-\u309F\u30A0-\u30FF]/);
  const maxLength = isJapanese ? 30 : 50;
  // const maxLength = 100000;
  return (
    <div className="flex flex-col items-center justify-start w-full max-w-md py-4 px-6 bg-white rounded shadow-lg">
      <div className="flex flex-col space-y-4 w-full h-full justify-between">
        <div className="flex w-full">
          <h1 className="text-2xl font-bold text-gray-900">
            <span
              className={
                prompt.length > maxLength
                  ? "text-xl font-bold text-gray-900"
                  : "text-2xl font-bold text-gray-900"
              }
            >
              {prompt.length > maxLength
                ? prompt.substring(0, maxLength) + "..."
                : prompt}
            </span>
          </h1>
        </div>
        {/* <p className="text-gray-500">{filename}</p> */}
        <div className="flex w-full justify-between">
          {/* <AudioPlayer audio={filename} /> */}
          (audio is not yet available)
          <p className="text-gray-500">{prettifyDate(date)}</p>
          {/* {language && <Flag language={parseMetadataLanguage(language)} />} */}
        </div>
        {/* <a
          href={`#voices/${history_hash}`}
          target="_blank"
          className="text-blue-500 hover:underline"
        >
          Voice
        </a> */}
        {/* <a
          href={`#generations/${history_hash}`}
          target="_blank"
          className="text-blue-500 hover:underline"
        >
          Generation info
        </a> */}
        <Metadata
          prompt={prompt}
          language={language || "unknown"}
          history_hash={history_hash}
          {...rest}
        />
      </div>
    </div>
  );
};

export const CardVoiceNpz = ({
  generation: { prompt, language, history_hash, filename, date, ...rest },
}: {
  generation: GenerationRaw;
}) => {
  // Detect if prompt is Japanese
  const isJapanese = prompt.match(/[\u3040-\u309F\u30A0-\u30FF]/);
  const maxLength = isJapanese ? 30 : 50;
  // const maxLength = 100000;
  return (
    <div className="flex flex-col items-center justify-start w-full max-w-md py-4 px-6 bg-white rounded shadow-lg">
      <div className="flex flex-col space-y-4 w-full h-full justify-between">
        <div className="flex w-full">
          <h1 className="text-2xl font-bold text-gray-900">
            <span
              className={
                prompt.length > maxLength
                  ? "text-xl font-bold text-gray-900"
                  : "text-2xl font-bold text-gray-900"
              }
            >
              {prompt.length > maxLength
                ? prompt.substring(0, maxLength) + "..."
                : prompt}
            </span>
          </h1>
        </div>
        <div className="flex w-full justify-between">
          <p className="text-gray-500">{prettifyDate(date)}</p>
        </div>
        <Metadata
          prompt={prompt}
          language={language || "unknown"}
          history_hash={history_hash}
          {...rest}
        />
      </div>
    </div>
  );
};

const HASH_OF_NONE = "6adf97f83acf6453d4a6a4b1070f3754"; // == md5("None")
export const SectionVoice = ({
  generation: {
    name,
    prompt,
    language,
    history_hash,
    filename,
    date,
    hash,
    ...rest
  },
  children,
}: {
  generation: GenerationRaw;
  children: React.ReactNode;
}) => {
  // Detect if prompt is Japanese
  const isJapanese = prompt.match(/[\u3040-\u309F\u30A0-\u30FF]/);
  const maxLength = isJapanese ? 30 : 50;
  const promptText =
    prompt.length > maxLength ? prompt.substring(0, maxLength) + "..." : prompt;
  const title = name || promptText;
  // const maxLength = 100000;
  return (
    <div className="flex flex-col items-center justify-start w-full py-4 px-6 bg-white rounded shadow-lg">
      <div className="flex flex-col space-y-4 w-full h-full justify-between">
        <div className="flex w-full">
          <h1 className="text-2xl font-bold text-gray-900">
            <span
              className={
                name === undefined && prompt.length > maxLength
                  ? "text-xl font-bold text-gray-900"
                  : "text-2xl font-bold text-gray-900"
              }
            >
              {title}
            </span>
          </h1>
        </div>
        <div className="flex w-full justify-between">
          {hash !== HASH_OF_NONE ? (
            <Download download={filename} />
          ) : (
            <div></div>
          )}
          <p className="text-gray-500">{prettifyDate(date)}</p>
        </div>
        <Metadata
          prompt={prompt}
          language={language || "unknown"}
          history_hash={history_hash}
          hash={hash}
          {...rest}
        />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Used in generations:</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
};

export const CardEmpty = ({ title, link }: { title: string; link: string }) => {
  return (
    <div className="flex flex-col items-center justify-start w-full max-w-md py-4 px-6 bg-white rounded shadow-lg">
      <div className="flex flex-col space-y-4 w-full h-full justify-between">
        <div className="flex items-center w-full gap-x-2">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <div className="flex w-full justify-center">
          <button
            className="w-24 h-24 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => window.open(link, "_blank")}
          >
            <MUIIcon
              icon={AddIcon}
              alt="Add a new voice"
              className="w-24 h-24 rounded"
            />
          </button>
        </div>
        <div className="flex w-full justify-between">
          <div className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
};

const Author = ({ author }: Pick<Voice, "author">) => {
  return (
    <a
      className="hover:opacity-50 w-9 h-9 flex items-center justify-center select-none"
      href={`https://github.com/${author}`}
      target="_blank"
      title={`Author: ${author}`}
    >
      <img
        src={AuthorIcon.src}
        width={AuthorIcon.width}
        height={AuthorIcon.height}
        alt="author"
      />
    </a>
  );
};

const Heart = () => <>&#x2764;</>;

const SaveToFavorites = ({ download }: Pick<Voice, "download">) => {
  const [favorites, setFavorites] = useFavorites();
  const isFavorite = favorites.includes(download);
  return (
    <button
      className={`w-9 h-9 text-xl text-gray-900 select-none ${
        isFavorite ? "text-red-500 hover:text-red-900" : "hover:text-red-500"
      }`}
      onClick={() =>
        saveOrDeleteFromFavorites(favorites, isFavorite, download, setFavorites)
      }
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart />
    </button>
  );
};

const AudioPlayer = ({ audio }: Pick<Voice, "audio">) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setIsPlaying(!isPlaying);
  };

  // set is playing to false when audio ends
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef.current]);

  return (
    <div className="flex items-center">
      <button
        className="-mx-2 w-8 h-8 hover:opacity-50"
        onClick={handlePlayPause}
      >
        <img
          src={isPlaying ? PauseIcon.src : PlayIcon.src}
          width={isPlaying ? PauseIcon.width : PlayIcon.width}
          height={isPlaying ? PauseIcon.height : PlayIcon.height}
          alt={isPlaying ? "Pause" : "Play"}
          className="select-none w-full h-full"
        />
      </button>
      <audio ref={audioRef} src={audio} />
    </div>
  );
};

const Download = ({ download }: Pick<Voice, "download">) => (
  <a
    className="-mx-2 w-8 h-8 hover:opacity-50 flex items-center justify-center select-none"
    href={download}
    title="Download .npz file"
  >
    <img
      src={DownloadIcon.src}
      width={DownloadIcon.width}
      height={DownloadIcon.height}
      alt="download"
      className="select-none w-full h-full"
    />
  </a>
);

const genderToIcon = {
  male: ManIcon,
  female: WomanIcon,
  other: OtherIcon,
};

const pink = "-70deg";
const blue = "180deg";
const purple = "210deg";
const genderToHue = {
  male: blue,
  female: pink,
  other: purple,
};

const Gender = ({ gender }: Pick<Voice, "gender">) => {
  const iconData = genderToIcon[gender] || genderToIcon.other;
  const color = genderToHue[gender];
  const filter = `invert(1) brightness(0.5) sepia(1) hue-rotate(${color}) saturate(3)`;
  return (
    <button className="select-none" title={`Gender: ${gender}`}>
      <img
        style={{
          filter,
        }}
        src={iconData.src}
        width={iconData.width}
        height={iconData.height}
      />
    </button>
  );
};

const Tags = ({ tags }: Pick<Voice, "tags">) => (
  <ul className="flex flex-wrap justify-start items-start content-start gap-2">
    {tags.map((tag) => (
      <li
        key={tag}
        className="px-2 py-1 text-sm font-medium text-gray-800 bg-gray-200 rounded"
      >
        {tag}
      </li>
    ))}
  </ul>
);

const parseMetadataLanguage = (language: string) => language.toLowerCase();

const prettifyDate = (date: string) => {
  const dateObj = parseMetadataDate(date);
  return (
    <time dateTime={date}>
      {dateObj.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",

        // hour: "numeric",
        // minute: "numeric",
      })}
    </time>
  );
};
