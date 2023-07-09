import {
  MicrophoneIcon,
  CubeIcon,
  WrenchIcon,
  SpeakerWaveIcon,
  FolderArrowDownIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";

import benefitOneImg from "../../public/img/benefit-one.png";
import benefitTwoImg from "../../public/img/benefit-two.png";

const benefitOne = {
  title: "Unveiling WebUI TTS",
  desc: "Harnessing the Power of Speech Generation",
  image: benefitOneImg,
  bullets: [
    {
      title: "Easy Text-to-Speech Generation",
      desc: "Generate high-quality speech audio with just a few clicks.",
      icon: <MicrophoneIcon />,
    },
    {
      title: "Versatile AI Models",
      desc: "Utilize powerful AI models like Bark, MusicGen, Tortoise, and Vocos for different TTS tasks.",
      icon: <CubeIcon />,
    },
    {
      title: "Wide Voice Selection",
      desc: (
        <>
          Access a variety of voices and additional voices from the{" "}
          <a
            href="https://rsxdalv.github.io/bark-speaker-directory/"
            className="text-gray-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bark Speaker Directory
          </a>
          .
        </>
      ),
      icon: <SpeakerWaveIcon />,
    },
  ],
};

const benefitTwo = {
  title: "The Robust Solution",
  desc: "A Platform for Responsible AI Use",
  image: benefitTwoImg,
  bullets: [
    {
      title: "Flexible Installation Options",
      desc: "Choose between one-click installers or manual installation based on your preferences.",
      icon: <FolderArrowDownIcon />,
    },
    {
      title: "Continuous Improvements",
      desc: "Regular updates and bug fixes ensure a reliable and efficient user experience.",
      icon: <WrenchIcon />,
    },
    {
      title: "Ethical and Responsible Use",
      desc: "Promotes ethical and responsible use of AI technology to foster positive engagement.",
      icon: <ShieldCheckIcon />,
    },
  ],
};

export { benefitOne, benefitTwo };
