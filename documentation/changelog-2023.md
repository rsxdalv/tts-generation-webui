# Changelog 2023

## December 2023

*No entries for December 2023*

## November 2023

*No entries for November 2023*

## October 2023

Oct 26:
* Improve model selection UX for Musicgen

Oct 24:
* Add initial React UI for Musicgen and Demucs (https://github.com/rsxdalv/tts-webui/pull/202)
* Fix Bark long generation seed drifting (thanks to https://github.com/520Pig520)

## September 2023

Sep 21:
* Bark: Add continue as semantic history button
* Switch to github docker image storage, new docker image:
  * `docker pull ghcr.io/rsxdalv/tts-webui:main`
* Fix server_port option in config https://github.com/rsxdalv/tts-webui/issues/168 , thanks to https://github.com/Dartvauder

Sep 9:
* Fix xdg-open command line, thanks to https://github.com/JFronny
* Fix multi-line bark generations, thanks to https://github.com/slack-t and https://github.com/bkutasi
* Add unload model button to Bark as requested by https://github.com/Aamir3d
* Add Bark details to README_Bark.md as requested by https://github.com/Maki9009
* Add "optional" to burn in prompt, thanks to https://github.com/Maki9009

Sep 5:
* Add voice mixing to Bark
* Add v1 Burn in prompt to Bark (Burn in prompts are for directing the semantic model without spending time on generating the audio. The v1 works by generating the semantic tokens and then using it as a prompt for the semantic model.)
* Add generation length limiter to Bark

## August 2023

Aug 27:
* Fix MusicGen ignoring the melody https://github.com/rsxdalv/tts-webui/issues/153

Aug 26:
* Add Send to RVC, Demucs, Vocos buttons to Bark and Vocos

Aug 24:
* Add date to RVC outputs to fix https://github.com/rsxdalv/tts-webui/issues/147
* Fix safetensors missing wheel
* Add Send to demucs button to musicgen

Aug 21:
* Add torchvision install to colab for musicgen issue fix
* Remove rvc_tab file logging

Aug 20:
* Fix MBD by reinstalling hydra-core at the end of an update

Aug 18:
* CI: Add a GitHub Action to automatically publish docker image.

Aug 16:
* Add "name" to tortoise generation parameters

Aug 15:
* Pin torch to 2.0.0 in all requirements.txt files
* Bump audiocraft and bark versions
* Remove Tortoise transformers fix from colab
* Update Tortoise to 2.8.0

Aug 13:
* Potentially big fix for new user installs that had issues with GPU not being supported

Aug 11:
* Tortoise hotfix thanks to [manmay-nakhashi](https://github.com/manmay-nakhashi)
* Add Tortoise option to change tokenizer

Aug 8:
* Update AudioCraft, improving MultiBandDiffusion performance
* Fix Tortoise parameter 'cond_free' mismatch with 'ultra_fast' preset

Aug 7:
* add tortoise deepspeed fix to colab

Aug 6:
* Fix audiogen + mbd error, add tortoise fix for colab

Aug 4:
* Add MultiBandDiffusion option to MusicGen https://github.com/rsxdalv/tts-webui/pull/109
* MusicGen/AudioGen save tokens on generation as .npz files. 

Aug 3:
* Add AudioGen https://github.com/rsxdalv/tts-webui/pull/105

Aug 2:
* Fix Model locations not showing after restart

## July 2023

July 26:
* Voice gallery
* Voice cropping
* Fix voice rename bug, rename picture as well, add a hash textbox
* Easier downloading of voices (https://github.com/rsxdalv/tts-webui/pull/98)

July 24:
* Change bark file format to include history hash: ...continued_generation... -> ...from_3ea0d063...

July 23:
* Docker Image thanks to https://github.com/jonfairbanks
* RVC UI naming improvements

July 21:
* Fix hubert not working with CPU only (https://github.com/rsxdalv/tts-webui/pull/87)
* Add Google Colab demo (https://github.com/rsxdalv/tts-webui/pull/88)
* New settings tab and model locations (for advanced users) (https://github.com/rsxdalv/tts-webui/pull/90)

July 19:
* Add Tortoise Optimizations, Thank you https://github.com/manmay-nakhashi https://github.com/rsxdalv/tts-webui/pull/79 (Implements https://github.com/rsxdalv/tts-webui/issues/18)

July 16:
* Voice Photo Demo
* Add a directory to store RVC models/indexes in and a dropdown
* Workaround rvc not respecting is_half for CPU https://github.com/rsxdalv/tts-webui/pull/74
* Tortoise model and voice selection improvements https://github.com/rsxdalv/tts-webui/pull/73

July 10:
* Demucs Demo https://github.com/rsxdalv/tts-webui/pull/67

July 9:
* RVC Demo + Tortoise, v6 installer with update script and automatic attempts to install extra modules https://github.com/rsxdalv/tts-webui/pull/66

July 5:
* Improved v5 installer - faster and more reliable https://github.com/rsxdalv/tts-webui/pull/63

July 2:
* Upgrade bark settings https://github.com/rsxdalv/tts-webui/pull/59

July 1:
* Studio-tab https://github.com/rsxdalv/tts-webui/pull/58

## June 2023

Jun 29:
* Tortoise new params https://github.com/rsxdalv/tts-webui/pull/54

Jun 27:
* Fix eager loading errors, refactor https://github.com/rsxdalv/tts-webui/pull/50

Jun 20:
* Tortoise: proper long form generation files https://github.com/rsxdalv/tts-webui/pull/46

Jun 19:
* Tortoise-upgrade https://github.com/rsxdalv/tts-webui/pull/45

June 18:
* Update to newest audiocraft, add longer generations

Jun 14:
* add vocos wav tab https://github.com/rsxdalv/tts-webui/pull/42

June 5:
* Fix "Save to Favorites" button on bark generation page, clean up console (v4.1.1)
* Add "Collections" tab for managing several different data sets and easier curration.

June 4:
* Update to v4.1 - improved hash function, code improvements

June 3:
* Update to v4 - new output structure, improved history view, codebase reorganization, improved metadata, output extensions support

## May 2023

May 21:
* Update to v3 - voice clone demo

May 17:
* Update to v2 - generate results as they appear, preview long prompt generations piece by piece, enable up to 9 outputs, UI tweaks

May 16:
* Add gradio settings tab, fix gradio errors in console, improve logging.
* Update History and Favorites with "use as voice" and "save voice" buttons
* Add voices tab
* Bark tab: Remove "or Use last generation as history"
* Improve code organization

May 13:
* Enable deterministic generation and enhance generated logs. Credits to https://github.com/suno-ai/bark/pull/175.

May 10:
* Enable the possibility of reusing history prompts from older generations. Save generations as npz files. Add a convenient method of reusing any of the last 3 generations for the next prompts. Add a button for saving and collecting history prompts under /voices. https://github.com/rsxdalv/tts-webui/pull/10

May 4:
* Long form generation (credits to https://github.com/suno-ai/bark/blob/main/notebooks/long_form_generation.ipynb and https://github.com/suno-ai/bark/issues/161)
* Adapt to fixed env var bug

May 3:
* Improved Tortoise UI: Voice, Preset and CVVP settings as well as ability to generate 3 results (https://github.com/rsxdalv/tts-webui/pull/6)

May 2:
* Added support for history recylcing to continue longer prompts manually
* Added support for v2 prompts

Before May 2023:
* Added support for Tortoise TTS
