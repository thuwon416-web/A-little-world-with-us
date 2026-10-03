'use client'

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'

export function Card({ className='', children }: { className?: string; children: ReactNode }) {
  return <div className={`ui-card ${className}`.trim()}>{children}</div>
}

export function Button({ variant='primary', className='', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'ghost' }) {
  const base = variant === 'primary' ? 'ui-button-primary' : variant === 'secondary' ? 'ui-button-secondary' : 'rounded-full text-text-1 hover:bg-accent-1/10'
  return <button {...props} className={`inline-flex min-h-10 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1/40 disabled:cursor-not-allowed disabled:opacity-50 ${base} ${className}`.trim()} />
}

export function Input({ className='', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`ui-control min-h-11 w-full px-3 py-2.5 text-sm outline-none transition ${className}`.trim()} />
}

export function Badge({ tone='primary', children }: { tone?: 'primary'|'secondary'|'success'|'warning'|'danger'; children: ReactNode }) {
  const tones = { primary:'bg-accent-1/10 text-accent-1 border-accent-1/20', secondary:'bg-accent-2/15 text-text-1 border-accent-2/25', success:'bg-success/10 text-success border-success/20', warning:'bg-warning/10 text-warning border-warning/20', danger:'bg-error/10 text-error border-error/20' }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export function Modal({ open, onClose, title, children }: { open:boolean; onClose:()=>void; title?:string; children:ReactNode }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(74_56_96/0.28)] p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
    <div className="ui-card max-h-[90dvh] w-full max-w-lg overflow-y-auto p-5 shadow-[0_18px_50px_rgb(74_56_96/0.16)]" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event)=>event.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between gap-3">{title?<h2 className="text-lg font-semibold text-text-1">{title}</h2>:<span/>}<button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-text-2 hover:bg-accent-1/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1/40"><X className="h-4 w-4"/></button></div>
      {children}
    </div>
  </div>
}

export function EmptyState({ title, description, action }: { title:string; description?:string; action?:ReactNode }) {
  return <div className="ui-panel flex min-h-40 flex-col items-center justify-center gap-2 p-6 text-center"><h3 className="text-base font-semibold text-text-1">{title}</h3>{description?<p className="max-w-md text-sm leading-6 text-text-2">{description}</p>:null}{action?<div className="mt-2">{action}</div>:null}</div>
}
