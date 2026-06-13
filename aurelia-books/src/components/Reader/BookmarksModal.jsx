export default function BookmarksModal({ bookmarks, onJumpTo, onRemove, onClose }) {
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-sheet"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">Bookmarks</span>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="modal-scroll">
          {bookmarks.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔖</div>
              <p>No bookmarks yet</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>
                Tap the bookmark icon while reading to save your place
              </p>
            </div>
          ) : (
            bookmarks.slice().reverse().map((bm, i) => (
              <div key={bm.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '14px 20px',
                    cursor: 'pointer',
                  }}
                  onClick={() => onJumpTo(bm.cfi)}
                >
                  <svg width="16" height="18" viewBox="0 0 24 24" fill="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M5 3h14v18l-7-4-7 4V3z"/>
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {bm.chapterTitle || 'Chapter'}
                    </p>
                    {bm.excerpt && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>
                        "{bm.excerpt}"
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, opacity: 0.6 }}>
                      {new Date(bm.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onRemove(bm.id); }}
                    style={{
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      color: 'var(--text-secondary)', padding: 4, flexShrink: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                {i < bookmarks.length - 1 && <div className="divider" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
