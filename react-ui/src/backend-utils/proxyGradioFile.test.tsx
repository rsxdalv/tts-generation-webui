import { proxyGradioFile, proxyGradioFilesInResult } from './proxyGradioFile';
import { defaultBackend } from './defaultBackend';

describe('proxyGradioFile', () => {
  test('returns input as is when input is not an object', () => {
    const input = 'not an object';
    expect(proxyGradioFile(input)).toBe(input);
  });

  test('returns input as is when input object does not have a url property', () => {
    const input = { foo: 'bar' };
    expect(proxyGradioFile(input)).toBe(input);
  });

  test('returns input as is when url does not start with defaultBackend', () => {
    const input = { url: 'https://example.com/file.wav' };
    expect(proxyGradioFile(input)).toBe(input);
  });

  test('replaces defaultBackend with /api/gradio-file-proxy/ in url', () => {
    const input = { url: `${defaultBackend}file/audio.wav` };
    const expected = { url: '/api/gradio-file-proxy/file/audio.wav' };
    expect(proxyGradioFile(input)).toEqual(expected);
  });

  test('handles complex Gradio file object correctly', () => {
    const input = [
      {
        "path": "C:\\Users\\rob\\AppData\\Local\\Temp\\gradio\\30e19519e4b162ce416e223eafc29da1dfa552ba75a59a831e68da763f5202a8\\audio.wav",
        "url": `${defaultBackend}gradio_api/file=C:\\Users\\rob\\AppData\\Local\\Temp\\gradio\\30e19519e4b162ce416e223eafc29da1dfa552ba75a59a831e68da763f5202a8\\audio.wav`,
        "size": null,
        "orig_name": "audio.wav",
        "mime_type": null,
        "is_stream": false,
        "meta": {
          "_type": "gradio.FileData"
        }
      },
      {
        "_version": "0.0.1",
        "_hash_version": "0.0.2",
        "text": "test",
        "language": "eng",
        "speaking_rate": 1,
        "noise_scale": 0.667,
        "noise_scale_duration": 0.8,
        "seed": "87903817",
        "outputs": null,
        "date": "2025-04-23 16:53:23.107821",
        "hash": "791c71ce8b0003ac376bd37095276ac8cf9212e859b6a777f8afc62752f11c23"
      },
      "outputs\\2025-04-23_16-53-23__mms__test"
    ];

    const expected = [
      {
        "path": "C:\\Users\\rob\\AppData\\Local\\Temp\\gradio\\30e19519e4b162ce416e223eafc29da1dfa552ba75a59a831e68da763f5202a8\\audio.wav",
        "url": `/api/gradio-file-proxy/gradio_api/file=C:\\Users\\rob\\AppData\\Local\\Temp\\gradio\\30e19519e4b162ce416e223eafc29da1dfa552ba75a59a831e68da763f5202a8\\audio.wav`,
        "size": null,
        "orig_name": "audio.wav",
        "mime_type": null,
        "is_stream": false,
        "meta": {
          "_type": "gradio.FileData"
        }
      },
      {
        "_version": "0.0.1",
        "_hash_version": "0.0.2",
        "text": "test",
        "language": "eng",
        "speaking_rate": 1,
        "noise_scale": 0.667,
        "noise_scale_duration": 0.8,
        "seed": "87903817",
        "outputs": null,
        "date": "2025-04-23 16:53:23.107821",
        "hash": "791c71ce8b0003ac376bd37095276ac8cf9212e859b6a777f8afc62752f11c23"
      },
      "outputs\\2025-04-23_16-53-23__mms__test"
    ];

    // Use map with proxyGradioFile for comparison with the next test
    const resultWithMap = input.map(item => proxyGradioFile(item));
    expect(resultWithMap).toEqual(expected);
  });

  test('uses proxyGradioFilesInResult to handle complex Gradio response', () => {
    const input = {
      data: [
        {
          "path": "C:\\Users\\rob\\AppData\\Local\\Temp\\gradio\\30e19519e4b162ce416e223eafc29da1dfa552ba75a59a831e68da763f5202a8\\audio.wav",
          "url": `${defaultBackend}gradio_api/file=C:\\Users\\rob\\AppData\\Local\\Temp\\gradio\\30e19519e4b162ce416e223eafc29da1dfa552ba75a59a831e68da763f5202a8\\audio.wav`,
          "size": null,
          "orig_name": "audio.wav",
          "mime_type": null,
          "is_stream": false,
          "meta": {
            "_type": "gradio.FileData"
          }
        },
        {
          "_version": "0.0.1",
          "_hash_version": "0.0.2",
          "text": "test",
          "language": "eng",
          "speaking_rate": 1,
          "noise_scale": 0.667,
          "noise_scale_duration": 0.8,
          "seed": "87903817",
          "outputs": null,
          "date": "2025-04-23 16:53:23.107821",
          "hash": "791c71ce8b0003ac376bd37095276ac8cf9212e859b6a777f8afc62752f11c23"
        },
        "outputs\\2025-04-23_16-53-23__mms__test"
      ]
    };

    const expected = {
      data: [
        {
          "path": "C:\\Users\\rob\\AppData\\Local\\Temp\\gradio\\30e19519e4b162ce416e223eafc29da1dfa552ba75a59a831e68da763f5202a8\\audio.wav",
          "url": `/api/gradio-file-proxy/gradio_api/file=C:\\Users\\rob\\AppData\\Local\\Temp\\gradio\\30e19519e4b162ce416e223eafc29da1dfa552ba75a59a831e68da763f5202a8\\audio.wav`,
          "size": null,
          "orig_name": "audio.wav",
          "mime_type": null,
          "is_stream": false,
          "meta": {
            "_type": "gradio.FileData"
          }
        },
        {
          "_version": "0.0.1",
          "_hash_version": "0.0.2",
          "text": "test",
          "language": "eng",
          "speaking_rate": 1,
          "noise_scale": 0.667,
          "noise_scale_duration": 0.8,
          "seed": "87903817",
          "outputs": null,
          "date": "2025-04-23 16:53:23.107821",
          "hash": "791c71ce8b0003ac376bd37095276ac8cf9212e859b6a777f8afc62752f11c23"
        },
        "outputs\\2025-04-23_16-53-23__mms__test"
      ]
    };

    // Use proxyGradioFilesInResult to process the entire response object
    const result = proxyGradioFilesInResult(input);
    expect(result).toEqual(expected);

    // Verify the URL was transformed correctly
    // Add type assertion to avoid TypeScript error
    expect((result.data[0] as any).url).toBe((expected.data[0] as any).url);

    // Verify that non-URL objects remain unchanged
    expect(result.data[1]).toBe(input.data[1]);
    expect(result.data[2]).toBe(input.data[2]);
  });
});
