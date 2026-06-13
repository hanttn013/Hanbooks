function TOCItem({ item, currentChapter, onJumpTo, depth = 0 }) {
  const isActive = item.label?.trim() === currentChapter;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '13px 20px',
          paddingLeft: 20 + depth * 16,
          cursor: 'pointer',
          background: isActive ? 'var(--bg-secondary)' : 'transparent',
          transition: 'background 100ms ease',
        }}
        onClick={() => item.href && onJumpTo(item.href)}
      >
        {isActive && (
          <div style={{
            width: 3, height: 16, background: 'var(--accent)',
            borderRadius: 2, marginRight: 10, flexShrink: 0,
          }} />
        )}
        <p style={{
          fontSize: depth === 0 ? 15 : 14,
          fontWeight: depth === 0 ? (isActive ? 700 : 500) : 400,
          color: isActive ? 'var(--accent)' : 'var(--text-primary)',
          flex: 1,
        }}>
          {item.label?.trim()}
        </p>
      </div>
      {item.subitems?.map((sub, i) => (
        <TOCItem key={i} item={sub} currentChapter={currentChapter} onJumpTo={onJumpTo} depth={depth + 1} />
      ))}
    </>
  );
}

export default function TOCModal({ toc, currentChapter, onJumpTo, onClose }) {
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
          <span className="modal-title">Table of Contents</span>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="modal-scroll">
          {toc.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>No table of contents available</p>
            </div>
          ) : (
            toc.map((item, i) => (
              <div key={i}>
                <TOCItem item={item} currentChapter={currentChapter} onJumpTo={onJumpTo} />
                {i < toc.length - 1 && <div className="divider" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
