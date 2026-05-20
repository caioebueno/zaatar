import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'
import type { Components } from 'react-markdown'

type Props = {
  content: string
}

const METHOD_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  GET:    { bg: 'rgba(34,211,238,0.07)',  text: '#22d3ee', border: 'rgba(34,211,238,0.2)',  dot: '#22d3ee' },
  POST:   { bg: 'rgba(52,211,153,0.07)',  text: '#34d399', border: 'rgba(52,211,153,0.2)',  dot: '#34d399' },
  PATCH:  { bg: 'rgba(251,191,36,0.07)',  text: '#fbbf24', border: 'rgba(251,191,36,0.2)',  dot: '#fbbf24' },
  DELETE: { bg: 'rgba(248,113,113,0.07)', text: '#f87171', border: 'rgba(248,113,113,0.2)', dot: '#f87171' },
  PUT:    { bg: 'rgba(167,139,250,0.07)', text: '#a78bfa', border: 'rgba(167,139,250,0.2)', dot: '#a78bfa' },
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

function Heading({ level, children }: { level: 2 | 3; children: React.ReactNode }) {
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
        href={`#${slug}`}
        className="opacity-0 group-hover:opacity-40 text-muted text-sm font-normal hover:opacity-70 transition-opacity"
        onClick={(e) => e.stopPropagation()}
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

const components: Components = {
  h1({ children }) {
    return (
      <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight tracking-tight">
        {children}
      </h1>
    )
  },

  h2({ children }) {
    return <Heading level={2}>{children}</Heading>
  },

  h3({ children }) {
    return <Heading level={3}>{children}</Heading>
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
          background: 'rgba(79,142,247,0.08)',
          color: '#93c5fd',
          border: '1px solid rgba(79,142,247,0.15)',
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
    return (
      <a href={href} className="text-accent underline decoration-accent/30 hover:decoration-accent transition-colors" target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
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
      <blockquote className="pl-4 my-4 text-muted italic text-sm" style={{ borderLeft: '2px solid #4f8ef7' }}>
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
    return <thead style={{ background: '#0a0e1a' }}>{children}</thead>
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

export function DocViewer({ content }: Props) {
  return (
    <div className="doc-content min-h-full">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
