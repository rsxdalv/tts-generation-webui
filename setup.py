import setuptools

# get requirements from requirements.txt
with open("requirements.txt") as f:
    requirements = f.read().splitlines()

setuptools.setup(
    name="tts_webui",
    packages=setuptools.find_namespace_packages(),
    version="0.0.17",
    author="rsxdalv",
    description="TTS Generation WebUI / Harmonica",
    url="https://github.com/rsxdalv/tts-generation-webui",
    project_urls={},
    scripts=[],
    # install_requires=[
    #     "extension_kokoro @ git+https://github.com/rsxdalv/extension_kokoro@main",
    #     "extension_rvc @ git+https://github.com/rsxdalv/extension_rvc@main",
    #     "openai",
    # ],
    install_requires=requirements,
    include_package_data=True,
    package_data={"": ["*.json"]},
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
