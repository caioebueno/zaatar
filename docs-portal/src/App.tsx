import { useCallback, useEffect, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { DocViewer } from './components/DocViewer'
import { SearchModal } from './components/SearchModal'
import { docs } from './docs-manifest'

function getInitialDoc() {
  const hash = window.location.hash.slice(1)
  return docs.find((d) => d.id === hash) ? hash : 'overview'
}

export default function App() {
  const [activeId, setActiveId] = useState(getInitialDoc)
  const [searchOpen, setSearchOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const activeDoc = docs.find((d) => d.id === activeId) ?? docs[0]!

  const navigate = useCallback((id: string) => {
    setActiveId(id)
    window.location.hash = id
    contentRef.current?.scrollTo({ top: 0 })
  }, [])

  // Sync hash → state (back/forward)
  useEffect(() => {
    const handler = () => {
      const id = window.location.hash.slice(1)
      if (docs.find((d) => d.id === id)) setActiveId(id)
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  // ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        activeId={activeId}
        onSelect={navigate}
        onSearchOpen={() => setSearchOpen(true)}
      />

      {/* Main content */}
      <main
        ref={contentRef}
        className="flex-1 overflow-y-auto h-full"
        style={{ background: '#07090f' }}
      >
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 flex items-center gap-2 px-10 py-3.5 border-b border-border-subtle text-xs text-muted"
          style={{ background: 'rgba(7,9,17,0.85)', backdropFilter: 'blur(12px)' }}
        >
          <span className="text-faint">Foody API</span>
          <ChevronIcon />
          {activeDoc.group && (
            <>
              <span>{activeDoc.group}</span>
              <ChevronIcon />
            </>
          )}
          <span className="text-foreground font-medium">{activeDoc.title}</span>
        </div>

        {/* Doc content */}
        <div className="max-w-3xl mx-auto px-10 pt-10 pb-24">
          <DocViewer key={activeId} content={activeDoc.content} />

          {/* Bottom navigation */}
          <DocNav activeId={activeId} onNavigate={navigate} />
        </div>
      </main>

      {/* Search modal */}
      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onSelect={navigate}
        />
      )}
    </div>
  )
}

function DocNav({ activeId, onNavigate }: { activeId: string; onNavigate: (id: string) => void }) {
  const idx = docs.findIndex((d) => d.id === activeId)
  const prev = idx > 0 ? docs[idx - 1] : null
  const next = idx < docs.length - 1 ? docs[idx + 1] : null

  if (!prev && !next) return null

  return (
    <div className="flex items-center justify-between mt-16 pt-6 border-t border-border-subtle">
      {prev ? (
        <button
          onClick={() => onNavigate(prev.id)}
          className="flex flex-col items-start gap-1 text-sm group"
        >
          <span className="text-xs text-faint">Previous</span>
          <span className="text-muted group-hover:text-accent transition-colors flex items-center gap-1">
            <span>←</span>
            <span>{prev.title}</span>
          </span>
        </button>
      ) : <div />}
      {next ? (
        <button
          onClick={() => onNavigate(next.id)}
          className="flex flex-col items-end gap-1 text-sm group"
        >
          <span className="text-xs text-faint">Next</span>
          <span className="text-muted group-hover:text-accent transition-colors flex items-center gap-1">
            <span>{next.title}</span>
            <span>→</span>
          </span>
        </button>
      ) : <div />}
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-faint">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
