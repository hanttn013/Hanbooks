import EpubReaderScreen from './EpubReaderScreen';
import UniversalReaderScreen from './UniversalReaderScreen';
import ReaderErrorBoundary from './ReaderErrorBoundary';

function inferFormat(book) {
  if (book?.format) return book.format;
  const match = String(book?.fileName || book?.sourcePath || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || 'epub';
}

export default function ReaderScreen(props) {
  const format = inferFormat(props.book);
  const reader = format === 'epub'
    ? <EpubReaderScreen {...props} />
    : <UniversalReaderScreen {...props} format={format} />;
  return <ReaderErrorBoundary onClose={props.onClose}>{reader}</ReaderErrorBoundary>;
}
