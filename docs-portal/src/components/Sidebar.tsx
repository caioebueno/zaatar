import type { DocEntry } from '../docs-manifest'
import { docs } from '../docs-manifest'

const GROUP_ORDER = [
  'Auth & Identity',
  'Business',
  'Catalog',
  'Operations',
  'Kitchen',
  'Drivers',
  'Analytics & Feedback',
  'Integrations',
]

const GROUP_ICONS: Record<string, string> = {
  'Auth & Identity': '⬡',
  'Business': '⬡',
  'Catalog': '⬡',
  'Operations': '⬡',
  'Kitchen': '⬡',
  'Drivers': '⬡',
  'Analytics & Feedback': '⬡',
  'Integrations': '⬡',
}

type Props = {
  activeId: string
  onSelect: (id: string) => void
  onSearchOpen: () => void
}

export function Sidebar({ activeId, onSelect, onSearchOpen }: Props) {
  const topLevel = docs.filter((d) => d.group === null)

  const grouped = GROUP_ORDER.map((groupName) => ({
    name: groupName,
    items: docs.filter((d) => d.group === groupName),
  })).filter((g) => g.items.length > 0)

  return (
    <aside
      className="flex flex-col h-full border-r border-border overflow-y-auto flex-shrink-0"
      style={{ width: 256, background: '#09091a' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border-subtle">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #7c5bf7 100%)' }}
        >
          F
        </div>
        <div className="min-w-0">
          <div className="text-foreground text-sm font-semibold leading-tight">Foody API</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="status-dot w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-muted text-xs font-mono">v1.0 · REST</span>
          </div>
        </div>
      </div>

      {/* Search trigger */}
      <div className="px-3 py-3 border-b border-border-subtle">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-muted text-sm hover:text-foreground transition-colors border border-border"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <SearchIcon />
          <span className="flex-1 text-left">Search docs…</span>
          <kbd className="text-xs font-mono border border-border px-1.5 py-0.5 rounded" style={{ background: '#111525', color: '#3a5080' }}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2">
        {/* Top-level (Overview) */}
        {topLevel.map((doc) => (
          <NavItem key={doc.id} doc={doc} active={activeId === doc.id} onSelect={onSelect} />
        ))}

        {/* Grouped */}
        {grouped.map((group) => (
          <div key={group.name} className="mt-5 first:mt-2">
            <div className="flex items-center gap-2 px-3 py-1 mb-1">
              <span className="text-accent opacity-40 text-xs">{GROUP_ICONS[group.name]}</span>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3a5080', letterSpacing: '0.08em' }}>
                {group.name}
              </span>
            </div>
            {group.items.map((doc) => (
              <NavItem key={doc.id} doc={doc} active={activeId === doc.id} onSelect={onSelect} />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border-subtle">
        <p className="text-xs text-faint">Base URL</p>
        <code className="text-xs font-mono text-muted">localhost:4000</code>
      </div>
    </aside>
  )
}

function NavItem({ doc, active, onSelect }: { doc: DocEntry; active: boolean; onSelect: (id: string) => void }) {
  return (
    <a
      href={`#${doc.id}`}
      onClick={(e) => { e.preventDefault(); onSelect(doc.id) }}
      className={[
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all cursor-pointer select-none',
        active
          ? 'nav-active text-accent font-medium'
          : 'text-muted hover:text-foreground hover:bg-white/[0.03]',
      ].join(' ')}
      style={active ? { paddingLeft: '10px' } : undefined}
    >
      <span
        className={[
          'w-1 h-1 rounded-full flex-shrink-0 transition-all',
          active ? 'bg-accent' : 'bg-faint',
        ].join(' ')}
      />
      {doc.title}
    </a>
  )
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
