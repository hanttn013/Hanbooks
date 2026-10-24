// src/components/Reader/SearchModal.jsx
import { useState, useCallback } from 'react';
import Sheet from '../UI/Sheet';
import { Action, Choice, SearchBox } from '../UI/Controls';
import { useI18n } from '../../i18n/context';

export default function SearchModal({ epubBook, currentCfi, onJumpTo, onClose }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('book');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !epubBook) return;
    setSearching(true);
    setResults([]);

    try {
      const spineItems = scope === 'chapter' && currentCfi
        ? [epubBook.spine.get(currentCfi)].filter(Boolean)
        : epubBook.spine.spineItems;

      const searchResults = await Promise.all(
        spineItems.map(async (item) => {
          try {
            await item.load(epubBook.load.bind(epubBook));
            const found = item.find(query);
            
            // Map to unified structure
            const matches = found.map(f => ({
              cfi: f.cfi,
              excerpt: f.excerpt,
              chapterTitle: item.idref || 'Content',
            }));
            
            item.unload();
            return matches;
          } catch (err) {
            console.error("Spine item search failed:", err);
            return [];
          }
        })
      );
      const flat = searchResults.flat().slice(0, 40);
      setResults(flat);
    } catch (err) {
      console.error("Book search failed:", err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query, epubBook, scope, currentCfi]);

  return <Sheet title="Search document" onClose={onClose}>
    <form className="action-row" onSubmit={event => { event.preventDefault(); handleSearch(); }}><SearchBox label="Search document" value={query} onChange={setQuery} autoFocus onSubmit={handleSearch} /><Action primary onPress={handleSearch} isPending={searching} disabled={!query.trim()}>{t('Search')}</Action></form>
    <Choice label="Search scope" value={scope} onChange={setScope} options={[{ id: 'book', label: 'Entire book' }, { id: 'chapter', label: 'Current chapter' }]} />
    <p role="status">{searching ? t('Loading...') : results.length ? `${results.length} ${t('Search results')}` : t('No matches found.')}</p>
    {results.map((result, index) => <div key={index}><Action onPress={() => { onJumpTo(result.cfi); onClose(); }}>{result.excerpt}</Action></div>)}
  </Sheet>;
}
