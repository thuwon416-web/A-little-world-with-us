'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { FileUp, LoaderCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { parseTelegramExport, type TelegramImportRow } from '@/lib/telegram-export'
import { useLanguage } from '@/contexts/LanguageContext'

const BATCH_SIZE = 500

export default function TelegramImport({ coupleId }: { coupleId: string }) {
  const { language } = useLanguage()
  const isMm = language === 'my'

  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<TelegramImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setRows([])
    setFileName('')
    setMessage('')
    setError('')
    if (!file) return
    try {
      const parsed = parseTelegramExport(JSON.parse(await file.text()))
      setRows(parsed)
      setFileName(file.name)
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : isMm
            ? 'ဖိုင်ကို ဖတ်မရပါ။'
            : 'Unable to parse file. Make sure it is valid Telegram JSON.'
      )
    } finally {
      event.target.value = ''
    }
  }

  const importRows = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const batchId = crypto.randomUUID()
      let inserted = 0
      for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
        const batch = rows.slice(offset, offset + BATCH_SIZE).map((row) => ({
          ...row,
          couple_id: coupleId,
          batch_id: batchId,
        }))
        const { count, error: insertError } = await supabase
          .from('telegram_memories')
          .upsert(batch, {
            onConflict: 'couple_id,message_date,sender_name,message_text',
            ignoreDuplicates: true,
            count: 'exact',
          })
        if (insertError) throw insertError
        inserted += count ?? 0
      }
      setMessage(
        isMm
          ? `မှတ်တမ်း ${inserted} ခု ထည့်ပြီးပါပြီ။ ထပ်နေသော မှတ်တမ်းများကို မထည့်ပါ။`
          : `Successfully imported ${inserted} messages. Duplicates were automatically skipped.`
      )
      setRows([])
      setFileName('')
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : isMm
            ? 'မှတ်တမ်းတင်သွင်းမှု မအောင်မြင်ပါ။'
            : 'Import failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="glass-card space-y-4 p-5 rounded-panel shadow-card" aria-labelledby="telegram-import-title">
      <div className="flex items-center gap-3">
        <FileUp className="h-5 w-5 text-accent-1" aria-hidden="true" />
        <div>
          <h2 id="telegram-import-title" className="font-semibold text-text-1">
            {isMm ? 'Telegram မှတ်တမ်းတင်သွင်းရန်' : 'Import Telegram History'}
          </h2>
          <p className="text-sm text-text-2">
            {isMm
              ? 'Telegram က ထုတ်ပေးသော JSON မှတ်တမ်းဖိုင်ကိုသာ လက်ခံသည်။'
              : 'Accepts exported JSON chat history files from Telegram Desktop.'}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={(event) => void chooseFile(event)}
        className="sr-only"
        aria-label={isMm ? 'Telegram JSON ဖိုင်ရွေးရန်' : 'Select Telegram JSON file'}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="rounded-pill border border-accent-1/25 px-4 py-2.5 text-sm font-medium text-text-1 hover:bg-card-hover transition active:scale-[0.98] disabled:opacity-60"
      >
        {isMm ? 'JSON ဖိုင်ရွေးရန်' : 'Select JSON file'}
      </button>
      {fileName ? (
        <div className="rounded-card bg-soft-tint p-4 text-sm text-text-1">
          <p className="font-medium">{fileName}</p>
          <p className="mt-1 text-text-2">
            {isMm
              ? `ထည့်သွင်းရန် အသင့်ဖြစ်သော စာသားမှတ်တမ်း ${rows.length} ခု`
              : `${rows.length} messages ready to import`}
          </p>
          <p className="mt-2 line-clamp-3 text-text-2">
            {rows.slice(0, 3).map((row) => `${row.sender_name}: ${row.message_text}`).join(' · ')}
          </p>
          <button
            type="button"
            onClick={() => void importRows()}
            disabled={loading || !rows.length}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-pill bg-accent-1 px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)] transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {isMm ? 'သိမ်းနေသည်…' : 'Importing…'}
              </>
            ) : isMm ? (
              'ကြိုတင်ကြည့်ပြီး သိမ်းရန်'
            ) : (
              'Confirm & Save'
            )}
          </button>
        </div>
      ) : null}
      {message ? <p role="status" className="text-sm text-success">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </section>
  )
}
