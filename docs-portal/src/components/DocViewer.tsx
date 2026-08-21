import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'
import type { Components } from 'react-markdown'
import { docs } from '../docs-manifest'

type Props = {
  content: string
  currentDocId: string
  currentSourcePath: string
  onNavigate: (id: string, anchor?: string) => void
}

const METHOD_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  GET:    { bg: 'rgba(160,160,160,0.08)', text: '#d9d4cc', border: 'rgba(160,160,160,0.22)', dot: '#d9d4cc' },
  POST:   { bg: 'rgba(82,180,128,0.10)', text: '#86d6a7', border: 'rgba(82,180,128,0.25)', dot: '#86d6a7' },
  PATCH:  { bg: 'rgba(209,162,74,0.12)', text: '#d1a24a', border: 'rgba(209,162,74,0.28)', dot: '#d1a24a' },
  DELETE: { bg: 'rgba(220,95,95,0.12)', text: '#e08a8a', border: 'rgba(220,95,95,0.26)', dot: '#e08a8a' },
  PUT:    { bg: 'rgba(196,130,83,0.12)', text: '#d7a26e', border: 'rgba(196,130,83,0.26)', dot: '#d7a26e' },
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function InlineEndpoint({ method, path }: { method: string; path: string }) {
  const colors = METHOD_COLORS[method] ?? METHOD_COLORS.GET
  return (
    <span
      className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 font-mono text-sm my-1"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: colors.text }}>
        {method}
      </span>
      <span className="text-foreground/80">{path}</span>
    </span>
  )
}

function Heading({
  level,
  children,
  currentDocId,
  onNavigate,
}: {
  level: 2 | 3
  children: React.ReactNode
  currentDocId: string
  onNavigate: (id: string, anchor?: string) => void
}) {
  const text = extractText(children)
  const slug = slugify(text)
  const Tag = `h${level}` as 'h2' | 'h3'

  const styles: Record<2 | 3, string> = {
    2: 'text-xl font-semibold mt-12 mb-4 pt-6 border-t border-border-subtle',
    3: 'text-base font-semibold mt-8 mb-3',
  }

  return (
    <Tag id={slug} className={`group flex items-center gap-2 text-foreground scroll-mt-8 ${styles[level]}`}>
      {children}
      <a
        href={`#${currentDocId}::${slug}`}
        className="opacity-0 group-hover:opacity-40 text-muted text-sm font-normal hover:opacity-70 transition-opacity"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onNavigate(currentDocId, slug)
        }}
      >
        #
      </a>
    </Tag>
  )
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in (node as React.ReactElement)) {
    return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props.children)
  }
  return ''
}

function resolveInternalDocLink(currentSourcePath: string, href: string): { docId: string; anchor?: string } | null {
  if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
    return null
  }

  if (href.startsWith('#')) {
    return { docId: '', anchor: href.slice(1) }
  }

  if (!href.includes('.md')) {
    return null
  }

  const baseUrl = new URL(currentSourcePath, 'https://docs.local/')
  const resolvedUrl = new URL(href, baseUrl)
  const sourcePath = resolvedUrl.pathname.replace(/^\//, '')
  const targetDoc = docs.find((doc) => doc.sourcePath === sourcePath)

  if (!targetDoc) {
    return null
  }

  return {
    docId: targetDoc.id,
    ...(resolvedUrl.hash ? { anchor: resolvedUrl.hash.slice(1) } : {}),
  }
}

function createComponents(currentDocId: string, currentSourcePath: string, onNavigate: (id: string, anchor?: string) => void): Components {
  return {
  h1({ children }) {
    return (
      <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight tracking-tight">
        {children}
      </h1>
    )
  },

  h2({ children }) {
    return <Heading level={2} currentDocId={currentDocId} onNavigate={onNavigate}>{children}</Heading>
  },

  h3({ children }) {
    return <Heading level={3} currentDocId={currentDocId} onNavigate={onNavigate}>{children}</Heading>
  },

  // Remove the default <pre> wrapper — our custom code handles it
  pre({ children }) {
    return <>{children}</>
  },

  code({ children, className }) {
    const lang = className?.replace('language-', '') ?? ''
    const code = String(children).replace(/\n$/, '')

    // Block code (has a language class from fenced ```)
    if (className) {
      return <CodeBlock language={lang} code={code} />
    }

    // Inline: detect HTTP endpoint pattern
    const methodMatch = code.trim().match(/^(GET|POST|PATCH|DELETE|PUT) (\/[^\s]*)$/)
    if (methodMatch) {
      return <InlineEndpoint method={methodMatch[1]} path={methodMatch[2]} />
    }

    // Plain inline code
    return (
      <code
        className="font-mono text-sm px-1.5 py-0.5 rounded"
        style={{
          background: 'rgba(209,162,74,0.10)',
          color: '#e8c27a',
          border: '1px solid rgba(209,162,74,0.22)',
        }}
      >
        {children}
      </code>
    )
  },

  p({ children }) {
    return (
      <p className="text-muted leading-7 mb-4 text-sm">
        {children}
      </p>
    )
  },

  a({ href, children }) {
    const sameDocAnchor = href?.startsWith('#') ? href.slice(1) : undefined
    const internalDocLink = href ? resolveInternalDocLink(currentSourcePath, href) : null
    const isInternalAnchor = Boolean(sameDocAnchor)
    const isInternalDoc = Boolean(internalDocLink)

    return (
      <a
        href={
          isInternalAnchor
            ? `#${currentDocId}::${sameDocAnchor}`
            : internalDocLink
              ? `#${internalDocLink.docId}${internalDocLink.anchor ? `::${internalDocLink.anchor}` : ''}`
              : href
        }
        className="text-accent underline decoration-accent/30 hover:decoration-accent transition-colors"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
        onClick={(e) => {
          if (sameDocAnchor) {
            e.preventDefault()
            onNavigate(currentDocId, sameDocAnchor)
            return
          }

          if (internalDocLink) {
            e.preventDefault()
            onNavigate(internalDocLink.docId, internalDocLink.anchor)
          }
        }}
      >
        {children}
      </a>
    )
  },

  ul({ children }) {
    return <ul className="my-3 space-y-1.5 text-sm text-muted">{children}</ul>
  },

  ol({ children }) {
    return <ol className="my-3 space-y-1.5 text-sm text-muted list-decimal pl-5">{children}</ol>
  },

  li({ children }) {
    return (
      <li className="flex items-start gap-2">
        <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0 bg-faint" />
        <span>{children}</span>
      </li>
    )
  },

  strong({ children }) {
    return <strong className="font-semibold text-foreground">{children}</strong>
  },

  em({ children }) {
    return <em className="italic text-muted">{children}</em>
  },

  hr() {
    return <hr className="my-8 border-0 border-t border-border-subtle" />
  },

  blockquote({ children }) {
    return (
      <blockquote className="pl-4 my-4 text-muted italic text-sm" style={{ borderLeft: '2px solid var(--color-accent)' }}>
        {children}
      </blockquote>
    )
  },

  table({ children }) {
    return (
      <div className="prose-table my-6 rounded-lg overflow-hidden border border-border text-sm">
        <table className="w-full border-collapse">{children}</table>
      </div>
    )
  },

  thead({ children }) {
    return <thead style={{ background: 'var(--color-elevated)' }}>{children}</thead>
  },

  th({ children }) {
    return (
      <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted border-b border-border">
        {children}
      </th>
    )
  },

  td({ children }) {
    return (
      <td className="px-4 py-2.5 text-muted border-b border-border-subtle font-mono text-xs">
        {children}
      </td>
    )
  },

  tr({ children }) {
    return <tr className="transition-colors hover:bg-white/[0.015]">{children}</tr>
  },
}
}

export function DocViewer({ content, currentDocId, currentSourcePath, onNavigate }: Props) {
  return (
    <div className="doc-content min-h-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={createComponents(currentDocId, currentSourcePath, onNavigate)}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
