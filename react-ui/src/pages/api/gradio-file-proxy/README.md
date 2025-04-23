# Gradio File Proxy

This API route provides a proxy for accessing files from the Gradio backend. It handles both standard Gradio file URLs and the special `gradio_api/file=` format.

## Usage

### Standard Gradio URLs

For standard Gradio URLs like:
```
http://127.0.0.1:7770/file/abc123.wav
```

Use the proxy URL:
```
/gradio-file-proxy/file/abc123.wav
```

### Gradio API File URLs

For Gradio API file URLs like:
```
http://127.0.0.1:7770/gradio_api/file=C:/Users/rob/AppData/Local/Temp/gradio/ae605205ea23ab0729a7bc21951f6e74e39095afa79e6a73fd369783efb6d2b2/audio.wav
```

Use the proxy URL:
```
/api/gradio-file-proxy/gradio_api/file=C:/Users/rob/AppData/Local/Temp/gradio/ae605205ea23ab0729a7bc21951f6e74e39095afa79e6a73fd369783efb6d2b2/audio.wav
```

## Implementation Details

The proxy:

1. Receives the request with the path after `/gradio-file-proxy/`
2. Reconstructs the original URL to the Gradio backend
3. Fetches the file from the Gradio backend
4. Streams the file back to the client with the appropriate headers

## Testing

You can test the proxy using the test page at `/test-gradio-proxy`.

## Integration with Gradio API

The proxy is automatically used by the Gradio API client through the `proxyGradioFile` function, which transforms file URLs in the response data to use the proxy.
