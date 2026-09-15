'use client'

import { useMemo, useState } from 'react'
import { Copy, RefreshCw, X } from 'lucide-react'

type PasswordGeneratorProps = {
  onSelect: (password: string) => void
  onClose: () => void
}

function strength(length: number, characterSets: number): string {
  if (length >= 20 && characterSets >= 3) return 'Strong'
  if (length >= 12 && characterSets >= 2) return 'Medium'
  return 'Weak'
}

export default function PasswordGenerator({ onSelect, onClose }: PasswordGeneratorProps) {
  const [length, setLength] = useState(20)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true)
  const [seed, setSeed] = useState(0)
  const [copied, setCopied] = useState(false)

  const password = useMemo(() => {
    let alphabet = ''
    if (uppercase) alphabet += 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    if (lowercase) alphabet += 'abcdefghijkmnopqrstuvwxyz'
    if (numbers) alphabet += excludeAmbiguous ? '23456789' : '0123456789'
    if (symbols) alphabet += '!@#$%^&*()-_=+[]{}'
    if (!alphabet) alphabet = 'abcdefghijkmnopqrstuvwxyz'
    const values = new Uint32Array(length)
    window.crypto.getRandomValues(values)
    return Array.from(values, (value) => alphabet[(value + seed) % alphabet.length]).join('')
  }, [excludeAmbiguous, length, lowercase, numbers, seed, symbols, uppercase])

  const copyPassword = async () => {
    await navigator.clipboard.writeText(password)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const sets = [uppercase, lowercase, numbers, symbols].filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Password generator</h2>
          <button type="button" onClick={onClose} aria-label="Close generator" className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-2)]"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 rounded-2xl bg-[var(--bg-2)] p-4">
          <p className="break-all font-mono text-lg text-[var(--text-primary)]">{password}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className={strength(length, sets) === 'Strong' ? 'text-emerald-400' : strength(length, sets) === 'Medium' ? 'text-amber-400' : 'text-red-400'}>{strength(length, sets)}</span>
            <button type="button" onClick={copyPassword} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-[var(--bg-3)]"><Copy className="h-3.5 w-3.5" />{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </div>
        <label className="mt-5 block text-sm text-[var(--text-secondary)]">Length: {length}
          <input type="range" min={8} max={64} value={length} onChange={(event) => setLength(Number(event.target.value))} className="mt-2 w-full accent-[var(--accent-1)]" />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-[var(--text-primary)]">
          {[
            ['Uppercase', uppercase, setUppercase],
            ['Lowercase', lowercase, setLowercase],
            ['Numbers', numbers, setNumbers],
            ['Symbols', symbols, setSymbols],
            ['Exclude ambiguous', excludeAmbiguous, setExcludeAmbiguous],
          ].map(([label, checked, setChecked]) => (
            <label key={label as string} className="flex items-center gap-2">
              <input type="checkbox" checked={checked as boolean} onChange={(event) => (setChecked as (value: boolean) => void)(event.target.checked)} />
              {label as string}
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setSeed((value) => value + 1)} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--accent-1)]/20 px-4 py-2 text-sm text-[var(--text-primary)]"><RefreshCw className="h-4 w-4" />Regenerate</button>
          <button type="button" onClick={() => { onSelect(password); onClose() }} className="rounded-2xl bg-[var(--button-bg)] px-4 py-2 text-sm text-[var(--text-primary)]">Use password</button>
        </div>
      </div>
    </div>
  )
}
