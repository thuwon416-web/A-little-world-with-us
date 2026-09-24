'use client'

import { useEffect, useState } from 'react'
import { Clock3, Plus, Sparkles } from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import { registerBrowserPushSubscription } from '@/lib/notifications'
import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId, supabase } from '@/lib/supabase'

type Reminder = {
  id: string
  title: string
  scheduled_at: string
  message: string
  enabled: boolean
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const loadReminders = async (activeCoupleId: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    const { data, error } = await supabase
      .from('reminders')
      .select('id,title,message,scheduled_at,active')
      .eq('couple_id', activeCoupleId)
      .order('scheduled_at', { ascending: true })
    setIsLoading(false)
    if (error) {
      setErrorMessage('သတိပေးချက်များကို ဖတ်မရပါ။ ခဏနေမှ ထပ်ကြိုးစားပါ။')
      return
    }
    setReminders(
      (data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message ?? '',
        scheduled_at: item.scheduled_at,
        enabled: item.active,
      }))
    )
  }

  useEffect(() => {
    void Promise.all([getCurrentUserId(), getCoupleStatus()]).then(([id, status]) => {
      const activeCoupleId = status.status === 'accepted' ? (status.couple?.id ?? null) : null
      setUserId(id)
      setCoupleId(activeCoupleId)
      if (activeCoupleId) void loadReminders(activeCoupleId)
    })
  }, [])

  const handleToggle = async (reminder: Reminder) => {
    setErrorMessage(null)
    const { error } = await supabase
      .from('reminders')
      .update({ active: !reminder.enabled })
      .eq('id', reminder.id)
    if (error) {
      setErrorMessage('သတိပေးချက် အခြေအနေကို မပြောင်းနိုင်ပါ။ ထပ်ကြိုးစားပါ။')
      return
    }
    if (coupleId) await loadReminders(coupleId)
  }

  const enableNotifications = async () => {
    try {
      const result = await registerBrowserPushSubscription()
      setNotice(
        result === 'enabled'
          ? 'ဒီဝဘ်ဘရောက်ဇာမှာ သတိပေးချက်ဖွင့်ပြီးပါပြီ။ အချိန်မှန်ပို့ဖို့ အချိန်ဇယားစနစ်နဲ့ လျှို့ဝှက်သော့များကို ဆာဗာမှာ ပြင်ဆင်ထားရပါမယ်။'
          : result === 'denied'
            ? 'ဘရောက်ဇာက သတိပေးခွင့်ကို ပိတ်ထားပါတယ်။ ဘရောက်ဇာဆက်တင်မှာ ခွင့်ပြုပါ။'
            : 'ဒီဘရောက်ဇာမှာ နောက်ခံသတိပေးချက် မပံ့ပိုးပါ။ ဖုန်းအက်ပ်က သတိပေးချက်ကို အသုံးပြုပါ။'
      )
    } catch (caught) {
      setNotice(
        caught instanceof Error
          ? `ဝဘ်သတိပေးချက်ကို မဖွင့်နိုင်ပါ။ ${caught.message}`
          : 'ဝဘ်သတိပေးချက်ကို မဖွင့်နိုင်ပါ။ ဆက်တင်များကို စစ်ဆေးပါ။'
      )
    }
  }

  const addReminder = async () => {
    if (!title.trim()) {
      setErrorMessage('ခေါင်းစဉ်ကို ဖြည့်ပါ။')
      return
    }
    if (!scheduledAt) {
      setErrorMessage('သတိပေးမည့်အချိန်ကို ရွေးပါ။')
      return
    }
    if (!coupleId || !userId) {
      setErrorMessage('သတိပေးချက်ဖန်တီးရန် အကောင့်နှစ်ခုကို အရင်ချိတ်ဆက်ပါ။')
      return
    }
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      setErrorMessage('အနာဂတ်အချိန်ကို ရွေးပါ။')
      return
    }
    setErrorMessage(null)
    const { error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        couple_id: coupleId,
        title: title.trim(),
        message: message.trim(),
        scheduled_at: new Date(scheduledAt).toISOString(),
        active: true,
      })
    if (error) {
      setErrorMessage('သတိပေးချက်ကို မသိမ်းနိုင်ပါ။ ထပ်ကြိုးစားပါ။')
      return
    }
    setTitle('')
    setMessage('')
    setScheduledAt('')
    await loadReminders(coupleId)
  }

  const nextReminder = reminders.find(
    (reminder) => reminder.enabled && new Date(reminder.scheduled_at).getTime() > Date.now()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-2">သတိပေးချက်များ</p>
          <h1 className="mt-2 text-3xl font-serif text-text-1">အချိန်မှန် သတိပေးရန်</h1>
        </div>
        <button
          type="button"
          onClick={enableNotifications}
          className="inline-flex items-center gap-2 rounded-full bg-accent-1 px-4 py-2 text-sm font-medium text-white"
        >
          <AnimatedIcon name="Bell" animation="wiggle" trigger="hover" size={16} />{' '}
          ဝဘ်အသိပေးခွင့်ပြုရန်
        </button>
      </div>

      {!coupleId && (
        <p className="rounded-btn border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          အကောင့်နှစ်ခုအကြား မျှဝေသတိပေးချက် ဖန်တီးရန် တွဲဖက်အကောင့်ကို ချိတ်ဆက်ပါ။
        </p>
      )}
      {errorMessage && (
        <p
          role="alert"
          className="rounded-btn border border-error/30 bg-error/10 p-4 text-sm text-error"
        >
          {errorMessage}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-btn border border-accent-1/20 bg-accent-1/5 p-4 text-sm text-text-2"
        >
          {notice}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-modal border border-accent-1/20 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-text-2">လာမည့်သတိပေးချက်များ</p>
            <button
              type="button"
              onClick={() => void addReminder()}
              disabled={!coupleId}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-text-1"
            >
              <Plus className="h-4 w-4" /> ထည့်ရန်
            </button>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="သတိပေးချက် ခေါင်းစဉ်"
              className="rounded-xl border border-border bg-soft-tint px-3 py-2 text-sm text-text-1"
            />
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="စာတို"
              className="rounded-xl border border-border bg-soft-tint px-3 py-2 text-sm text-text-1"
            />
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="rounded-xl border border-border bg-soft-tint px-3 py-2 text-sm text-text-1"
            />
          </div>

          <div className="space-y-3">
            {isLoading && <p className="text-sm text-text-2">သတိပေးချက်များကို ဖတ်နေသည်…</p>}
            {!isLoading && reminders.length === 0 && (
              <p className="text-sm text-text-2">သိမ်းထားသော သတိပေးချက် မရှိသေးပါ။</p>
            )}
            {reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-[22px] border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-text-1">{reminder.title}</p>
                    <p className="mt-1 text-sm text-text-2">{reminder.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleToggle(reminder)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      reminder.enabled ? 'bg-success/15 text-success' : 'bg-soft-tint text-text-2'
                    }`}
                  >
                    {reminder.enabled ? 'ဖွင့်ထားသည်' : 'ပိတ်ထားသည်'}
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-text-2">
                  <Clock3 className="h-4 w-4 text-accent-2" />
                  {new Date(reminder.scheduled_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-accent-2/20 bg-card p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-text-2">
              နောက်တစ်ကြိမ် သတိပေးမည့်အချိန်
            </p>
            <p className="mt-2 text-2xl font-semibold text-text-1">
              {nextReminder
                ? new Date(nextReminder.scheduled_at).toLocaleString()
                : 'လာမည့်သတိပေးချက် မရှိပါ'}
            </p>
          </div>

          <div className="rounded-[24px] border border-border bg-card p-5">
            <div className="flex items-center gap-3 text-accent-1">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">အဆင်ပြေသလို သတိပေးရန်</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-2">
              သတိပေးချက်များကို ဖိအားမဖြစ်စေဘဲ အချင်းချင်း သတိရစေရန် ဖန်တီးထားပါသည်။
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
