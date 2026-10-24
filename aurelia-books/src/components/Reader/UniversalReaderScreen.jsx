import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { createReaderAdapter } from '../../readers/readerRegistry';
import { createLocator, locatorFromProgress, parseLocator } from '../../readers/locator';
import { useReader } from '../../hooks/useReader';
import { APP_THEMES, READER_FONTS, getFontStack, getThemeById } from '../../styles/designTokens';
import styles from './UniversalReaderScreen.module.css';
import { Action, Choice, Field, Range, SearchBox } from '../UI/Controls';
import Sheet from '../UI/Sheet';
import { useI18n } from '../../i18n/context';

function PdfPage({ adapter, page, zoom }) {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    const host = canvasRef.current?.closest('section');
    if (!host) return;
    const measure = () => {
      const style = getComputedStyle(host);
      setWidth(Math.max(100, host.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let textLayer;
    const render = async () => {
      const canvas = canvasRef.current;
      const textContainer = textLayerRef.current;
      if (!canvas || !textContainer) return;
      textContainer.replaceChildren();
      if (!width) return;
      const result = await adapter.renderPage(canvas, page, { maxWidth: width, scale: zoom });
      if (cancelled) return;
      textContainer.style.width = result.viewport.width + 'px';
      textContainer.style.height = result.viewport.height + 'px';
      textContainer.style.setProperty('--total-scale-factor', result.viewport.scale);
      textContainer.style.setProperty('--scale-factor', result.viewport.scale);
      textLayer = new adapter.pdfjs.TextLayer({
        textContentSource: result.text,
        container: textContainer,
        viewport: result.viewport,
      });
      await textLayer.render();
    };
    render().catch(error => {
      if (error?.name !== 'RenderingCancelledException') {
        if (!cancelled) setError(error.message || 'Could not render this PDF page.');
      }
    });
    return () => {
      cancelled = true;
      textLayer?.cancel();
    };
  }, [adapter, page, zoom, width]);

  return (
    <div className={styles.pdfPage}>
      {error && <p role="alert">{error}</p>}
      <canvas ref={canvasRef} />
      <div ref={textLayerRef} className={styles.textLayer} />
    </div>
  );
}

function PresentationSlide({ adapter, index }) {
  const { t } = useI18n();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let nextUrl = '';
    adapter.getSlideSvg(index).then(svg => {
      if (!active) return;
      nextUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      setUrl(nextUrl);
    }).catch(error => { if (active) setError(error.message || 'Slide rendering failed.'); });
    return () => {
      active = false;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [adapter, index]);
  if (error) return <article><p role="alert">{t('Slide layout unavailable')}: {error}</p><p>{adapter.fallbackSlideTexts?.[index] || t('No extractable text on this slide.')}</p></article>;
  return url ? <img className={styles.slide} src={url} alt={t('Page number', { count: index + 1 })} /> : <p>{t('Rendering slide…')}</p>;
}

function applySavedHighlights(root, bookmarks) {
  if (!root) return;
  root.querySelectorAll('mark[data-shanbooks-highlight]').forEach(mark => mark.replaceWith(document.createTextNode(mark.textContent || '')));
  for (const bookmark of bookmarks) {
    const quote = bookmark.excerpt?.trim();
    if (!quote) continue;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const index = node.nodeValue?.indexOf(quote) ?? -1;
      if (index >= 0) {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + quote.length);
        const mark = document.createElement('mark');
        mark.dataset.shanbooksHighlight = bookmark.id;
        mark.title = bookmark.note || 'Saved highlight';
        range.surroundContents(mark);
        break;
      }
      node = walker.nextNode();
    }
  }
}

export default function UniversalReaderScreen({ book, format, settings, updateSetting, onClose, onBookUpdate }) {
  const { t } = useI18n();
  const [showContents, setShowContents] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [noteEditor, setNoteEditor] = useState(false);
  const [note, setNote] = useState('');
  const [chromeVisible, setChromeVisible] = useState(true);
  const [adapter, setAdapter] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [toc, setToc] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [renderVersion, setRenderVersion] = useState(0);
  const [selection, setSelection] = useState(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searchError, setSearchError] = useState('');
  const contentRef = useRef(null);
  const restoredRef = useRef(false);
  const adapterRef = useRef(null);
  const locationRef = useRef(null);
  const onBookUpdateRef = useRef(onBookUpdate);
  const scrollSaveTimerRef = useRef(null);
  const pendingScrollLocationRef = useRef(null);
  const finishedRef = useRef(book.status === 'finished');
  const flushProgressRef = useRef(() => {});
  const { progress, bookmarks, saveProgress, addBookmark, isBookmarked, startReading, stopReading, markFinished } = useReader(book.id);

  useEffect(() => {
    onBookUpdateRef.current = onBookUpdate;
  }, [onBookUpdate]);

  const saveLocation = useCallback((next) => {
    if (!next?.locator) return;
    const percentage = Math.min(100, Math.max(0, (Number(next.percentage) || 0) * 100));
    if (percentage >= 98 && !finishedRef.current) {
      finishedRef.current = true;
      markFinished?.();
      onBookUpdateRef.current?.({ status: 'finished' });
    }
    return saveProgress(next.locator, percentage, next.chapterTitle || '').catch(error => {
      console.warn('Could not save document position:', error);
    });
  }, [saveProgress, markFinished]);

  const persistLocation = useCallback((next) => {
    if (!next?.locator) return;
    locationRef.current = next;
    setLocation(next);
    return saveLocation(next);
  }, [saveLocation]);

  const captureReflowableLocation = useCallback(() => {
    if (!['txt', 'md', 'html', 'docx'].includes(format)) return null;
    const content = contentRef.current;
    if (!content) return null;
    const paged = settings.readingMode === 'classic';
    const position = paged ? content.scrollLeft : content.scrollTop;
    const maximum = paged
      ? Math.max(1, content.scrollWidth - content.clientWidth)
      : Math.max(1, content.scrollHeight - content.clientHeight);
    const percentage = Math.min(1, Math.max(0, position / maximum));
    const parsedLocation = parseLocator(locationRef.current?.locator) || { format };
    const payload = Object.fromEntries(Object.entries(parsedLocation).filter(([key]) => key !== 'format' && key !== 'offset'));
    return { locator: createLocator(format, { ...payload, offset: percentage }), percentage };
  }, [format, settings.readingMode]);

  const flushLatestProgress = useCallback(() => {
    window.clearTimeout(scrollSaveTimerRef.current);
    scrollSaveTimerRef.current = null;
    const latest = pendingScrollLocationRef.current || captureReflowableLocation() || locationRef.current;
    pendingScrollLocationRef.current = null;
    if (!latest?.locator) return;
    locationRef.current = latest;
    return saveLocation(latest);
  }, [captureReflowableLocation, saveLocation]);

  useEffect(() => {
    flushProgressRef.current = flushLatestProgress;
  }, [flushLatestProgress]);

  useEffect(() => {
    let nativeListener = null;
    let disposed = false;
    const flushProgress = () => flushLatestProgress();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushProgress();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', flushProgress);
    window.addEventListener('beforeunload', flushProgress);
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) flushProgress();
    }).then(listener => {
      if (disposed) listener.remove();
      else nativeListener = listener;
    }).catch(() => {
      nativeListener = null;
    });

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', flushProgress);
      window.removeEventListener('beforeunload', flushProgress);
      nativeListener?.remove?.();
    };
  }, [flushLatestProgress]);

  const closeReader = useCallback(() => {
    flushLatestProgress();
    onClose();
  }, [flushLatestProgress, onClose]);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    const open = async () => {
      if (!book.fileBlob) throw new Error('The original document file is missing. Import it again to continue reading.');
      const nextAdapter = await createReaderAdapter(format, { book });
      adapterRef.current = nextAdapter;
      unsubscribe = nextAdapter.onRelocate(persistLocation);
      await nextAdapter.open(book.fileBlob);
      if (!active) {
        nextAdapter.destroy();
        return;
      }
      const [nextMetadata, nextToc] = await Promise.all([nextAdapter.getMetadata(), nextAdapter.getToc()]);
      setAdapter(nextAdapter);
      setMetadata(nextMetadata);
      setToc(nextToc);
      const initial = nextAdapter.getLocation();
      setLocation(initial);
      locationRef.current = initial;
      startReading();
      setLoading(false);
      onBookUpdateRef.current?.({ lastOpenedAt: Date.now(), status: book.status === 'unread' ? 'reading' : book.status });
    };
    open().catch(nextError => {
      if (active) {
        setError(nextError);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
      flushProgressRef.current();
      stopReading();
      adapterRef.current?.destroy();
      adapterRef.current = null;
    };
  }, [book, format, persistLocation, startReading, stopReading]);

  useEffect(() => {
    if (!adapter || restoredRef.current || !progress) return;
    const saved = locatorFromProgress(progress);
    if (!saved) return;
    restoredRef.current = true;
    adapter.goTo(JSON.stringify(saved)).then(() => setRenderVersion(value => value + 1));
  }, [adapter, progress]);

  useEffect(() => {
    const anchor = parseLocator(location?.locator)?.anchor;
    if (anchor) contentRef.current?.querySelector(`#${CSS.escape(anchor)}`)?.scrollIntoView({ block: 'start' });
    const offset = parseLocator(location?.locator)?.offset;
    const content = contentRef.current;
    if (content && Number.isFinite(offset)) {
      if (settings.readingMode === 'classic') content.scrollLeft = offset * Math.max(0, content.scrollWidth - content.clientWidth);
      else content.scrollTop = offset * Math.max(0, content.scrollHeight - content.clientHeight);
    }
  }, [location, renderVersion, settings.readingMode]);

  useEffect(() => {
    if (!['txt', 'md', 'html', 'docx'].includes(format)) return;
    applySavedHighlights(contentRef.current, bookmarks);
  }, [bookmarks, format, renderVersion]);

  const captureSelection = () => {
    const current = window.getSelection();
    const text = current?.toString().trim().slice(0, 120);
    if (!text || !current.rangeCount || !contentRef.current?.contains(current.anchorNode)) {
      setSelection(null);
      return;
    }
    const parent = current.anchorNode.nodeType === Node.TEXT_NODE ? current.anchorNode.parentElement : current.anchorNode;
    const anchor = parent?.closest?.('[id]')?.id || parseLocator(location?.locator)?.anchor || 'top';
    setSelection({ text, locator: createLocator(format, { anchor, quote: text }) });
  };

  const saveHighlight = async () => {
    if (!selection) return;
    await addBookmark(selection.locator, metadata?.title || '', selection.text, note);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setNoteEditor(false);
    setNote('');
  };

  const move = async direction => {
    if (!adapter) return;
    if (['txt', 'md', 'html', 'docx'].includes(format) && settings.readingMode === 'classic' && contentRef.current) {
      contentRef.current.scrollBy({ left: (direction === 'next' ? 1 : -1) * contentRef.current.clientWidth, behavior: 'smooth' });
      return;
    }
    await adapter[direction]();
    setRenderVersion(value => value + 1);
  };

  const trackReflowableScroll = () => {
    if (!['txt', 'md', 'html', 'docx'].includes(format) || !contentRef.current) return;
    const next = captureReflowableLocation();
    if (!next) return;
    pendingScrollLocationRef.current = next;
    window.clearTimeout(scrollSaveTimerRef.current);
    scrollSaveTimerRef.current = window.setTimeout(() => {
      scrollSaveTimerRef.current = null;
      const pending = pendingScrollLocationRef.current;
      pendingScrollLocationRef.current = null;
      if (pending) persistLocation(pending);
    }, 300);
  };

  const runSearch = async event => {
    event?.preventDefault?.();
    setSearchAttempted(true);
    setSearchError('');
    try { setResults(await adapter.search(query)); }
    catch (error) { setResults([]); setSearchError(error.message || 'Search failed.'); }
  };

  const goToResult = async result => {
    let locator = result.locator;
    if (format === 'pdf') locator = createLocator('pdf', { page: result.page, offset: 0 });
    if (format === 'pptx') locator = createLocator('pptx', { slide: result.slide });
    if (locator) {
      await adapter.goTo(locator);
      setRenderVersion(value => value + 1);
      setResults([]);
      setSearchAttempted(false);
    }
  };

  useEffect(() => {
    if (loading || showContents || showSettings || showBookmarks || showSearch || noteEditor || !chromeVisible) return;
    let timer;
    const hide = () => {
      if (document.activeElement?.closest('[data-reader-chrome]')) timer = window.setTimeout(hide, 4000);
      else setChromeVisible(false);
    };
    timer = window.setTimeout(hide, 5000);
    return () => window.clearTimeout(timer);
  }, [loading, showContents, showSettings, showBookmarks, showSearch, noteEditor, chromeVisible]);

  const theme = getThemeById(settings.theme);
  const readerStyle = useMemo(() => ({
    '--document-bg': theme.bg,
    '--document-text': theme.text,
    '--document-font': getFontStack(settings.font),
    '--document-size': `${settings.fontSize}px`,
    '--document-line': settings.lineHeight,
    '--document-margin': `${settings.marginWidth}px`,
    '--document-spacing': `${settings.letterSpacing}px`,
  }), [settings, theme.bg, theme.text]);

  if (loading) return <main className={styles.state}><p>{t('Opening format', { format: String(format).toUpperCase() })}</p></main>;
  if (error) return <main className={styles.state}><h1>{t('Could not open this document')}</h1><p>{error.message}</p><Action primary onPress={closeReader}>{t('Return to library')}</Action></main>;
  const parsed = parseLocator(location?.locator) || {};
  const bookmarked = isBookmarked(location?.locator);
  const jumpToContents = async item => {
    const target = format === 'pdf' ? createLocator('pdf', { page: item.page || 1, offset: 0 })
      : format === 'pptx' ? createLocator('pptx', { slide: item.slide })
      : format === 'cbz' ? createLocator('cbz', { page: item.page })
      : createLocator(format, { anchor: item.id });
    await adapter.goTo(target); setRenderVersion(value => value + 1); setShowContents(false);
  };
  return <main className={styles.reader} style={readerStyle} data-format={format} data-chrome-hidden={!chromeVisible || undefined} onKeyDownCapture={() => setChromeVisible(true)}>
    <header data-reader-chrome className={`${styles.toolbar} safe-top`}>
      <Action label={t('Close reader')} onPress={closeReader}>{t('Close')}</Action><div className={styles.title}><strong>{book.title}</strong><small>{String(format).toUpperCase()} · {Math.round((location?.percentage || 0) * 100)}%</small></div>
      <Action label={t(bookmarked ? 'Bookmarked' : 'Add bookmark')} disabled={bookmarked} onPress={() => addBookmark(location.locator, metadata?.title || '', '').catch(console.error)}>{bookmarked ? '★' : '☆'}</Action>
      <Action label={t('Show bookmarks')} onPress={() => setShowBookmarks(true)}>{t('Bookmarks')}</Action>
    </header>
    <nav data-reader-chrome className={styles.controls} aria-label={t('Reader controls')}>
      <Action label={t('Table of contents')} onPress={() => setShowContents(true)}>{t('Contents')}</Action>
      <Action onPress={() => setShowSearch(true)}>{t('Search')}</Action>
      {(['txt', 'md', 'html', 'docx'].includes(format) && updateSetting || format === 'pdf') && <Action label={t('Reader settings')} onPress={() => setShowSettings(true)}>Aa</Action>}
    </nav>
    {!chromeVisible && <button className="reveal-controls" aria-label={t('Show reader controls')} onClick={() => setChromeVisible(true)}>☰</button>}
    {showContents && <Sheet title="Table of contents" onClose={() => setShowContents(false)}>{toc.length ? toc.map((item, index) => <div key={item.id || index}><Action onPress={() => jumpToContents(item)}>{item.label}</Action></div>) : <p>{t('No table of contents available')}</p>}</Sheet>}
    {showSearch && <Sheet title="Search document" onClose={() => setShowSearch(false)}>
      <form className="action-row" onSubmit={runSearch}><SearchBox label="Search document" value={query} onChange={setQuery} autoFocus onSubmit={runSearch} /><Action primary onPress={runSearch}>{t('Search')}</Action></form>
      {searchAttempted && !results.length && <p role="status">{searchError || t('No matches found.')}</p>}
      <section aria-label={t('Search results')}>{results.map((result, index) => <div key={index}><Action onPress={async () => { await goToResult(result); setShowSearch(false); }}>{result.excerpt}</Action></div>)}</section>
    </Sheet>}
    {showSettings && <Sheet title="Reading settings" onClose={() => setShowSettings(false)}>
      {format === 'pdf' ? <><Range label="PDF zoom" min={0.6} max={2} step={0.1} value={zoom} onChange={setZoom} /><Action onPress={() => setZoom(1)}>{t('Fit width')}</Action></> : <div className="field-grid">
        <Choice label="Reader font" value={settings.font} onChange={value => updateSetting('font', value)} options={READER_FONTS} />
        <Range label="Reader font size" value={settings.fontSize} min={14} max={32} onChange={value => updateSetting('fontSize', value)} />
        <Range label="Reader line height" value={settings.lineHeight} min={1.2} max={2.4} step={0.1} onChange={value => updateSetting('lineHeight', value)} />
        <Range label="Reader margins" value={settings.marginWidth} min={8} max={48} onChange={value => updateSetting('marginWidth', value)} />
        <Choice label="Reader theme" value={settings.theme} onChange={value => updateSetting('theme', value)} options={APP_THEMES} />
        <Choice label="Reader mode" value={settings.readingMode} onChange={value => updateSetting('readingMode', value)} options={[{ id: 'scroll', label: 'Scroll' }, { id: 'classic', label: 'Pages' }]} />
      </div>}
    </Sheet>}
    {showBookmarks && <Sheet title="Saved bookmarks" onClose={() => setShowBookmarks(false)}>{bookmarks.length ? bookmarks.map(bookmark => <div key={bookmark.id}><Action onPress={async () => { await adapter.goTo(bookmark.locator || bookmark.cfi); setRenderVersion(value => value + 1); setShowBookmarks(false); }}>{bookmark.chapterTitle || t('Bookmark')} {bookmark.excerpt || bookmark.note || ''}</Action></div>) : <p>{t('No bookmarks yet. Use ☆ to save this position.')}</p>}</Sheet>}
    {selection && <div className={styles.highlightAction}><Action onPress={() => setNoteEditor(true)}>{t('Highlight & note')}</Action></div>}
    {noteEditor && <Sheet title="Highlight & note" onClose={() => setNoteEditor(false)} footer={<Action primary onPress={saveHighlight}>{t('Save')}</Action>}><p>{selection?.text}</p><Field label="Optional note" value={note} onChange={setNote} /></Sheet>}
    <section ref={contentRef} className={`${styles.content} ${['txt', 'md', 'html', 'docx'].includes(format) && settings.readingMode === 'classic' ? styles.pagedContent : ''}`} onMouseUp={captureSelection} onClick={() => { if (!window.getSelection()?.toString()) setChromeVisible(value => !value); }} onScroll={trackReflowableScroll}>
      {metadata?.fidelityNotice && <aside className={styles.notice}>{t(metadata.fidelityNotice)}</aside>}
      {['txt', 'md', 'html', 'docx'].includes(format) && <article className={styles.reflowable} dangerouslySetInnerHTML={{ __html: adapter.getContent() }} />}
      {format === 'pdf' && <PdfPage adapter={adapter} page={parsed.page || 1} zoom={zoom} key={`${parsed.page || 1}-${renderVersion}`} />}
      {format === 'pptx' && <PresentationSlide adapter={adapter} index={parsed.slide || 0} key={`${parsed.slide || 0}-${renderVersion}`} />}
      {format === 'cbz' && <img className={styles.comicPage} src={adapter.getPageUrl()} alt={t('Page number', { count: (parsed.page || 0) + 1 })} />}
    </section>
    <footer data-reader-chrome className={`${styles.navigation} safe-bottom`}><Action onPress={() => move('prev')}>{t('Previous')}</Action><span>{format === 'pdf' ? `${parsed.page || 1} / ${metadata?.estimatedPages || 1}` : format === 'pptx' ? `${(parsed.slide || 0) + 1} / ${metadata?.estimatedPages || 1}` : format === 'cbz' ? `${(parsed.page || 0) + 1} / ${metadata?.estimatedPages || 1}` : `${Math.round((location?.percentage || 0) * 100)}%`}</span><Action onPress={() => move('next')}>{t('Next')}</Action></footer>
  </main>;
}
