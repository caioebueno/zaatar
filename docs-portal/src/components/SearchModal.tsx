import { useEffect, useRef, useState } from 'react'
import { docs, type DocEntry } from '../docs-manifest'

type Props = {
  onClose: () => void
  onSelect: (id: string) => void
}

function scoreMatch(doc: DocEntry, query: string): number {
  const q = query.toLowerCase()
  const titleScore = doc.title.toLowerCase().includes(q) ? 2 : 0
  const groupScore = (doc.group ?? '').toLowerCase().includes(q) ? 1 : 0
  const contentScore = doc.content.toLowerCase().includes(q) ? 0.5 : 0
  return titleScore + groupScore + contentScore
}

function getExcerpt(content: string, query: string): string {
  const lower = content.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return content.slice(0, 120).replace(/#+\s*/g, '').trim() + '…'
  const start = Math.max(0, idx - 40)
  const end = Math.min(content.length, idx + query.length + 80)
  return (start > 0 ? '…' : '') + content.slice(start, end).replace(/#+\s*/g, '').trim() + (end < content.length ? '…' : '')
}

export function SearchModal({ onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = query.trim().length === 0
    ? docs.slice(0, 8)
    : docs
        .map((doc) => ({ doc, score: scoreMatch(doc, query.trim()) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(({ doc }) => doc)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const selected = results[activeIdx]
      if (selected) { onSelect(selected.id); onClose() }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  return (
    <div
      className="search-backdrop fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(7,9,17,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border overflow-hidden shadow-2xl"
        style={{ background: '#0d1020' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation…"
            className="flex-1 bg-transparent py-4 text-sm text-foreground placeholder-muted outline-none font-sans"
          />
          <kbd
            className="text-xs font-mono text-faint border border-border px-1.5 py-0.5 rounded"
            style={{ background: '#0a0e1a' }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted text-sm">
              No results for <span className="text-foreground">"{query}"</span>
            </div>
          ) : (
            results.map((doc, i) => (
              <button
                key={doc.id}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                style={{ background: i === activeIdx ? 'rgba(79,142,247,0.08)' : undefined }}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => { onSelect(doc.id); onClose() }}
              >
                <div
                  className="mt-0.5 w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs font-mono"
                  style={{ background: '#111525', color: '#4f8ef7', border: '1px solid #1c2440' }}
                >
                  {doc.title[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{doc.title}</span>
                    {doc.group && (
                      <span className="text-xs text-faint">{doc.group}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {getExcerpt(doc.content, query)}
                  </p>
                </div>
                {i === activeIdx && (
                  <span className="ml-auto flex-shrink-0 text-faint self-center">
                    <ReturnIcon />
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-xs text-faint">
          <span className="flex items-center gap-1"><ArrowIcon />Navigate</span>
          <span className="flex items-center gap-1"><ReturnIcon />Open</span>
          <span className="flex items-center gap-1"><EscIcon />Close</span>
        </div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg className="text-muted flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ReturnIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 10 4 15 9 20" /><path d="M20 4v7a4 4 0 01-4 4H4" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><polyline points="5 12 12 19 19 12" />
    </svg>
  )
}

function EscIcon() {
  return <span className="font-mono text-xs">⎋</span>
}
