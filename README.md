# TTS Generation WebUI (Bark v2, Tortoise)

## One click installers
https://github.com/rsxdalv/one-click-installers-tts

This code provides a Gradio interface for generating audio from text input using the Bark TTS and Tortoise TTS models. The interface takes a text prompt as input and generates audio as output.

![Screenshot 1](./screenshots/screenshot%20(1).png)
![Screenshot 2](./screenshots/screenshot%20(2).png)
![Screenshot 3](./screenshots/screenshot%20(3).png)
![Screenshot 4](./screenshots/screenshot%20(4).png)
![Screenshot 5](./screenshots/screenshot%20(5).png)

## Dependencies

This code requires the following dependencies:

- `bark` in models/bark directory from https://github.com/suno-ai/bark
- `scipy`
- `gradio`


## Changelog
May 3:
* Improved Tortoise UI: Voice, Preset and CVVP settings as well as ability to generate 3 results (https://github.com/rsxdalv/tts-generation-webui/pull/6)

May 2 Update 2:
* Added support for history recylcing to continue longer prompts manually

May 2 Update 1:
* Added support for v2 prompts

Before:
* Added support for Tortoise TTS

## To customize the installation, you may clone one of bark model forks within models/bark

git clone https://github.com/rsxdalv/bark.git
