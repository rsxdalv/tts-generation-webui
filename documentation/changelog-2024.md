# Changelog 2024

## December 2024

Dec 17:
* Attempt fix of #429, #428, #427

## November 2024

Nov 23:
* Add linux fairseq wheel for better pip compatibility.

Nov 22:
* Switch to wheels, add one-shot install prompt.

Nov 15:
* upgrade to gradio 5.5.0, add Resemble Enhance (#420)

Nov 14:
* Add experimental Windows deepspeed wheel.
* Add more languages to Bark voice clone.

Nov 11:
* Switch to a fixed fairseq version for windows reducing installation conflicts and speeding up updates.

## October 2024


Oct 28:
* Added installer tests, model downloader, and pip CPU-only option for Torch.

Oct 24:
* Downgraded Gradio to 5.1.0 due to a bug.
* Added test workflows and fixed minor bugs.

Oct 22:
* Fixed Dockerfile issues for smoother deployment.

Oct 21:
* Redesigned README: improved Whisper extension, added changelogs for August, September, and October, updated screenshots, and reorganized content.

Oct 19:
* Fixed extension logs and added new extensions.

Oct 18:
* System improvements: formatted project, fixed `xformers+cuda` install, added log system, uninstall extension button, and F5 TTS extension.

Oct 16:
* First install now uses `pip` instead of `uv`.
* Bumped major version and fixed Google Colab.
* Added pip fallback to stable audio.
* Fixed Demucs, changed Postgres port.
* Fixed `huggingface_hub` install and Bark model loader.
* Major upgrades: switched to Gradio 5, lazy loading for tabs, Docker fixes, optimized UI speed, added .env.user feature, improved logs, and upgraded React UI extensions.

Oct 3:
* Fixed GPU info tab and added `nvidia-ml-py`.
* Created workaround for Audiocraft install bug.
* Fixed automatic MSVC install and set server to `127.0.0.1`.
* Fixed `.git_version` path and removed `iconv` to eliminate `node-gyp` requirement.
* Improved installer error handling, added upgrade hash logging.
* Upgraded Node.js to 22.9.0, added PostgreSQL support, grouped tabs in React UI.



## September 2024


Sep 23:
* Automatically use CUDA for MMS.

Sep 22:
* Added ffmpeg metadata extension to React UI.
* Added mono-only notice for Maha TTS.
* Hotfix to avoid Node 20.17.0 installation failure.

Sep 21:
* Added stable audio demo to React UI.
* Improved UI layout.

Sep 19:
* Upgraded React UI visual look with new Sliders and better layout.
* Optimized RVC UI, fixed Colab, and added a search command box.
* Upgrade Node.js to 20.17.0.

Sep 2:
* Fixed Dockerfile and updated docker-compose.yml.
* Fixed bug in npz loading.



## August 2024


Aug 31:
* Upgrade model inference framework to decorators.
* Moved Python files from `src` to `tts_webui` folder.
* Rewrote the MusicGen tab and fixed related bugs.

Aug 20:
* Upgraded to Gradio 4 and added theme.
* Added model loading messages for Tortoise.
* Fixed ReactUI's RVC.
* Refactored hyperparameters.
* Added management to extensions list, XTTS-Simple extension.

Aug 5:
* Fix Bark in React UI, add Max Generation Duration.
* Change AudioCraft Plus extension models directory to ./data/models/audiocraft_plus/
* Improve model unloading for MusicGen and AudioGen. Add unload models button to MusicGen and AudioGen.
* Add Huggingface Cache Manager extension.

Aug 4:
* Add XTTS-RVC-UI extension, XTTS Fine-tuning demo extension.

Aug 3:
* Add Riffusion extension, AudioCraft Mac extension, Bark Legacy extension.

Aug 2:
* Add deprecation warning to old installer.
* Unify error handling and simplify tab loading.

Aug 1:
* Add "Attempt Update" button for external extensions.
* Skip reinstalling packages when pip_packages version is not changed.
* Synchronize Gradio Port with React UI.
* Change default Gradio port to 7770 from 7860.


## July 2024


July 31:
* Fix React UI's MusicGen after the Gradio changes.
* Add unload button to Whisper extension.

July 29:
* Change FFMpeg to 4.4.2 from conda-forge in order to support more platforms, including Mac M1.
* Disable tortoise CVVP.

July 26:
* Whisper extension
* Experimental AMD ROCM install support. (Linux only)

July 25:
* Add diagnostic scripts for MacOS and Linux.
* Add better error details for tabs.
* Fix .sh script execution permissions for the installers on Linux and MacOS.

July 21:
* Add Gallery History extension (adapted from the old gallery view)
* Convert Simple Remixer to extension
* Fix update.py to use the newer torch versions (update.py is only for legacy purposes and will likely break)
* Add Diagnostic script and Force Reinstall scripts for Windows.

July 20:
* Fix Discord join link
* Simplify Bark further, removing excessive complexity in code.
* Add UI/Modular extensions, these extensions allow installing new models and features to the UI. In the future, models will start as extensions before being added permamently.
* Disable Gallery view in outputs
* Known issue: Firefox fails at showing outputs in Gradio, it fails at fetching them from backend. Within React UI this works fine.

July 15:
* Comment - As the React UI has been out for a long time now, Gradio UI is going to have the role of serving only the functions to the user, without the extremely complicated UI that it cannot handle. There is a real shortage of development time to add new models and features, but the old style of integration was not viable. As the new APIs and 'the role of the model' is defined, it will be possible to have extensions for entire models, enabling a lot more flexibility and lighter installations.
* Start scaling back Gradio UI complexity - removed _send to RVC/Demucs/Voice_ buttons. (Remove internal component Joutai).
* Add version.json for better updates in the future.
* Reduce Gradio Bark maximum number of outputs to 1.
* Add unload model button to Tortoise, also unload the model before loading the next one/changing parameters, thus tortoise no longer uses 2x model memory during the settings change.

July 14:
* Regroup Gradio tabs into groups - Text to Speech, Audio Conversion, Music Generation, Outputs and Settings
* Clean up the header, add link for feedback
* Add seed control to Stable Audio
* Fix Stable Audio filename bug with newlines
* Disable "Simple Remixer" Gradio tab
* Fix bark voice clone & RVC once more
* Add "Installed Packages" tab for debugging

July 13:
* Major upgrade to Torch 2.3.1 and xformers 0.0.27
  * All users, including Mac and CPU will now have the same PyTorch version.
* Upgrade CUDA to 11.8
* Force python to be 3.10.11
* Modify installer to allow upgrading Python and Torch without reinstalling (currently major version 2)
* Fix magnet default params for better quality
* Improve installer script checks to avoid bugs
* Update StyleTTS2

July 11:
* Improve Stable Audio generation filenames
* Add force reinstall to torch repair
* Make the installer auto-update before running

July 9:
* Fix new installer and installation instructions thanks to https://github.com/Xeraster !

July 8:
* Change the installation process to reduce package clashes and enable torch version flexibility.

July 6:
* Initial release of new mamba based installer.
* Save Stable Audio results to outputs-rvc/StableAudio folder.
* Add a disclaimer to Stable Audio model selection and show better error messages when files are missing.

July 1:
* Optimize Stable Audio memory usage after generation.
* Open React UI automatically only if gradio also opens automatically.
* Remove unnecessary conda git reinstall.
* Update to lastest Stable Audio which has mps support (requires newer torch versions).


## June 2024

June 22:
* Add Stable Audio to Gradio.

June 21:
* Add Vall-E-X demo to React UI.
* Open React UI automatically in browser, fix the link again.
* Add Split By Length to React/Tortoise.
* Fix UVR5 demo folders.
* Set fairseq version to 0.12.2 for Linux and Mac. (#323)
* Improve generation history for all React UI tabs.

May 17:
* Fix Tortoise presets in React UI.

May 9:
* Add MMS to React UI.
* Improve React UI and codebase.

May 4:
* Group Changelog by month


## April 2024

Apr 28:
* Add Maha TTS to React UI.
* Add GPU Info to React UI.

Apr 6:
* Add Vall-E-X generation demo tab.
* Add MMS demo tab.
* Add Maha TTS demo tab.
* Add StyleTTS2 demo tab.

Apr 5:
* Fix RVC installation bug.
* Add basic UVR5 demo tab.

Apr 4:
* Upgrade RVC to include RVMPE and FCPE. Remove the direct file input for models and indexes due to file duplication. Improve React UI interface for RVC.

## March 2024

Mar 28:
* Add GPU Info tab

Mar 27:
* Add information about voice cloning to tab voice clone

Mar 26:
* Add Maha TTS demo notebook

Mar 22:
* Vall-E X demo via notebook (#292)
* Add React UI to Docker image
* Add install disclaimer

Mar 16:
* Upgrade vocos to 0.1.0

Mar 14:
* StyleTTS2 Demo Notebook

Mar 13:
* Add Experimental Pipeline (Bark / Tortoise / MusicGen / AudioGen / MAGNeT -> RVC / Demucs / Vocos) (#287)
* Fix RVC bug with model reloading on each generation. For short inputs that results in a visible speedup.

Mar 11:
* Add Play as Audio and Save to Voices to bark (#286)
* Change UX to show that files are deleted from favorites
* Fix images for bark voices not showing
* Fix audio playback in favorites

Mar 10:
* Add Batching to React UI Magnet (#283)
* Add audio to audio translation to SeamlessM4T (#284)

Mar 5:
* Add Batching to React UI MusicGen (#281), thanks to https://github.com/Aamir3d for requesting this and providing feedback

Mar 3:
* Add MMS demo as a notebook
* Add MultiBandDiffusion high VRAM disclaimer

## February 2024

Feb 21:
* Fix Docker container builds and bug with Docker-Audiocraft

Feb 8:
* Fix MultiBandDiffusion for MusicGen's stereo models, thank you https://github.com/mykeehu
* Fix Node.js installation steps on Google Colab, code by https://github.com/miaohf

Feb 6:
* Add FLAC file generation extension by https://github.com/JoaCHIP

## January 2024

Jan 21:
* Add CPU/M1 torch auto-repair script with each update. To disable, edit check_cuda.py and change FORCE_NO_REPAIR = True

Jan 16:
* Upgrade MusicGen, adding support for stereo and large melody models
* Add MAGNeT

Jan 15:
* Upgraded Gradio to 3.48.0
  * Several visual bugs have appeared, if they are critical, please report them or downgrade gradio.
  * Gradio: Suppress useless warnings
* Supress Triton warnings
* Gradio-Bark: Fix "Use last generation as history" behavior, empty selection no longer errors
* Improve extensions loader display
* Upgrade transformers to 4.36.1 from 4.31.0
* Add SeamlessM4T Demo

Jan 14:
* React UI: Fix missing directory errors

Jan 13:
* React UI: Fix missing npm build step from automatic install

Jan 12:
* React UI: Fix names for audio actions
* Gradio: Fix multiple API warnings
* Integration - React UI now is launched alongside Gradio, with a link to open it

Jan 11:
* React UI: Make the build work without any errors

Jan 9:
* React UI
  * Fix 404 handler for Wavesurfer
  * Group Bark tabs together

Jan 8:
* Release React UI
