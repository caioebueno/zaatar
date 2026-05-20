import { useEffect, useRef, useState } from 'react'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import bash from 'highlight.js/lib/languages/bash'
import plaintext from 'highlight.js/lib/languages/plaintext'
import http from 'highlight.js/lib/languages/http'

hljs.registerLanguage('json', json)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('plaintext', plaintext)
hljs.registerLanguage('http', http)

type Props = {
  code: string
  language: string
}

const LANG_ALIASES: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  sh: 'bash',
  shell: 'bash',
  http: 'plaintext',
  '': 'plaintext',
}

export function CodeBlock({ code, language }: Props) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)

  const resolvedLang = LANG_ALIASES[language] ?? language
  const displayLang = language || 'text'

  useEffect(() => {
    if (!codeRef.current) return
    const supported = hljs.getLanguage(resolvedLang)
    codeRef.current.innerHTML = supported
      ? hljs.highlight(code, { language: resolvedLang, ignoreIllegals: true }).value
      : hljs.highlightAuto(code, ['json', 'typescript', 'bash', 'http']).value
  }, [code, resolvedLang])

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-5 rounded-lg overflow-hidden border border-border" style={{ background: '#0d1117' }}>
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-border"
        style={{ background: '#0a0e1a' }}
      >
        <span className="text-xs font-mono text-faint tracking-wider uppercase">
          {displayLang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors px-2 py-0.5 rounded"
          style={{ background: copied ? 'rgba(79,142,247,0.1)' : undefined }}
        >
          {copied ? (
            <>
              <CheckIcon />
              <span className="text-accent">Copied</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto px-5 py-4">
        <pre className="m-0 p-0" style={{ background: 'transparent' }}>
          <code ref={codeRef} className="hljs" />
        </pre>
      </div>
    </div>
  )
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
