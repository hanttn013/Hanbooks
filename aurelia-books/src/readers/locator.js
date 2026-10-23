export function createLocator(format, position = {}) {
  if (!format) throw new Error('A locator format is required.');
  return JSON.stringify({ format, ...position });
}

export function parseLocator(locator) {
  if (!locator) return null;
  if (typeof locator === 'object') return locator;
  try {
    const parsed = JSON.parse(locator);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return locator.startsWith('epubcfi(') ? { format: 'epub', cfi: locator } : null;
  }
}

export function locatorFromProgress(progress) {
  const parsed = parseLocator(progress?.locator);
  if (parsed) return parsed;
  if (progress?.cfi) return { format: 'epub', cfi: progress.cfi };
  return null;
}
