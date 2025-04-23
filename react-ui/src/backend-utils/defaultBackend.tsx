export const defaultBackend =
  process.env.GRADIO_BACKEND ||
  process.env.GRADIO_BACKEND_AUTOMATIC ||
  "http://127.0.0.1:7770/";
