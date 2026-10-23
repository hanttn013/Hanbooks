const BLOCKED_TAGS = ['script', 'iframe', 'object', 'embed', 'form', 'base', 'meta', 'link'];

export async function sanitizeDocumentHtml(source) {
  const { default: DOMPurify } = await import('dompurify');
  const clean = DOMPurify.sanitize(String(source || ''), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: BLOCKED_TAGS,
    FORBID_ATTR: ['srcset', 'formaction'],
    SANITIZE_NAMED_PROPS: true,
  });
  const document = new DOMParser().parseFromString(clean, 'text/html');
  document.querySelectorAll('[src]').forEach(element => {
    const value = element.getAttribute('src') || '';
    if (!/^(?:data:image\/|blob:)/i.test(value)) element.removeAttribute('src');
  });
  document.querySelectorAll('a[href]').forEach(element => {
    const value = element.getAttribute('href') || '';
    if (/^javascript:/i.test(value)) element.removeAttribute('href');
    else {
      element.setAttribute('rel', 'noreferrer noopener');
      element.setAttribute('target', '_blank');
    }
  });
  return document.body.innerHTML;
}

export function prepareHeadings(html) {
  const document = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const toc = [...document.querySelectorAll('h1, h2, h3')].map((heading, index) => {
    const id = heading.id || `heading-${index + 1}`;
    heading.id = id;
    return { id, label: heading.textContent?.trim() || `Section ${index + 1}`, level: Number(heading.tagName[1]) };
  });
  return { html: document.body.innerHTML, toc };
}
