import mammoth from 'mammoth/mammoth.browser';

self.onmessage = async event => {
  try {
    const result = await mammoth.convertToHtml(
      { arrayBuffer: event.data.buffer },
      {
        includeEmbeddedStyleMap: false,
        externalFileAccess: false,
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
        ],
      },
    );
    self.postMessage({ ok: true, value: result.value, messages: result.messages });
  } catch (error) {
    self.postMessage({ ok: false, message: error?.message || 'DOCX conversion failed.' });
  }
};
