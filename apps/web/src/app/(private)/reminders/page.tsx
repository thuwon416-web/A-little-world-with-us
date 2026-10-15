'use client'

import { useEffect, useState } from 'react'
import { Clock3, Plus, Sparkles } from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import { registerBrowserPushSubscription } from '@/lib/notifications'
import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId, supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

type Reminder = {
  id: string
  title: string
  scheduled_at: string
  message: string
  enabled: boolean
}

export default function RemindersPage() {
  const { language } = useLanguage()
  const isMm = language === 'my'

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
      setErrorMessage(
        isMm
          ? 'သတိပေးချက်များကို ဖတ်မရပါ။ ခဏနေမှ ထပ်ကြိုးစားပါ။'
          : 'Unable to load reminders. Please try again shortly.'
      )
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
    if (!coupleId) return
    const channel = supabase
      .channel(`web-reminders-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          void loadReminders(coupleId)
        }
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  // The loader is intentionally kept local to the page; coupleId is the subscription boundary.
  }, [coupleId])

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
      setErrorMessage(
        isMm
          ? 'သတိပေးချက် အခြေအနေကို မပြောင်းနိုင်ပါ။ ထပ်ကြိုးစားပါ။'
          : 'Could not change reminder status. Please try again.'
      )
      return
    }
    if (coupleId) await loadReminders(coupleId)
  }

  const enableNotifications = async () => {
    try {
      const result = await registerBrowserPushSubscription()
      setNotice(
        result === 'enabled'
          ? isMm
            ? 'ဒီဝဘ်ဘရောက်ဇာမှာ သတိပေးချက်ဖွင့်ပြီးပါပြီ။ အချိန်မှန်ပို့ဖို့ အချိန်ဇယားစနစ်နဲ့ လျှို့ဝှက်သော့များကို ဆာဗာမှာ ပြင်ဆင်ထားရပါမယ်။'
            : 'Web notifications enabled on this browser. Background scheduled delivery requires server cron setup.'
          : result === 'denied'
            ? isMm
              ? 'ဘရောက်ဇာက သတိပေးခွင့်ကို ပိတ်ထားပါတယ်။ ဘရောက်ဇာဆက်တင်မှာ ခွင့်ပြုပါ။'
              : 'Notification permission was denied. Please allow notifications in browser settings.'
            : isMm
              ? 'ဒီဘရောက်ဇာမှာ နောက်ခံသတိပေးချက် မပံ့ပိုးပါ။ ဖုန်းအက်ပ်က သတိပေးချက်ကို အသုံးပြုပါ။'
              : 'Background push is not supported in this browser. Please use the mobile app.'
      )
    } catch (error_) {
      setNotice(
        error_ instanceof Error
          ? isMm
            ? `ဝဘ်သတိပေးချက်ကို မဖွင့်နိုင်ပါ။ ${error_.message}`
            : `Could not enable web notifications: ${error_.message}`
          : isMm
            ? 'ဝဘ်သတိပေးချက်ကို မဖွင့်နိုင်ပါ။ ဆက်တင်များကို စစ်ဆေးပါ။'
            : 'Could not enable web notifications. Please check settings.'
      )
    }
  }

  const addReminder = async () => {
    if (!title.trim()) {
      setErrorMessage(isMm ? 'ခေါင်းစဉ်ကို ဖြည့်ပါ။' : 'Please enter a title.')
      return
    }
    if (!scheduledAt) {
      setErrorMessage(isMm ? 'သတိပေးမည့်အချိန်ကို ရွေးပါ။' : 'Please select a date and time.')
      return
    }
    if (!coupleId || !userId) {
      setErrorMessage(
        isMm
          ? 'သတိပေးချက်ဖန်တီးရန် အကောင့်နှစ်ခုကို အရင်ချိတ်ဆက်ပါ။'
          : 'Connect with your partner first to create shared reminders.'
      )
      return
    }
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      setErrorMessage(isMm ? 'အနာဂတ်အချိန်ကို ရွေးပါ။' : 'Please select a future time.')
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
      setErrorMessage(
        isMm ? 'သတိပေးချက်ကို မသိမ်းနိုင်ပါ။ ထပ်ကြိုးစားပါ။' : 'Could not save reminder. Please try again.'
      )
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
          <p className="text-xs uppercase tracking-[0.22em] text-text-2">
            {isMm ? 'သတိပေးချက်များ' : 'Reminders'}
          </p>
          <h1 className="mt-2 text-3xl font-serif text-text-1">
            {isMm ? 'အချိန်မှန် သတိပေးရန်' : 'Timely Reminders'}
          </h1>
        </div>
        <button
          type="button"
          onClick={enableNotifications}
          className="inline-flex items-center gap-2 rounded-pill bg-accent-1 px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-95 active:scale-[0.98]"
        >
          <AnimatedIcon name="Bell" animation="wiggle" trigger="hover" size={16} />{' '}
          {isMm ? 'ဝဘ်အသိပေးခွင့်ပြုရန်' : 'Enable Web Notifications'}
        </button>
      </div>

      {!coupleId && (
        <p className="rounded-btn border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          {isMm
            ? 'အကောင့်နှစ်ခုအကြား မျှဝေသတိပေးချက် ဖန်တီးရန် တွဲဖက်အကောင့်ကို ချိတ်ဆက်ပါ။'
            : 'Connect with your partner to share scheduled reminders together.'}
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
        <div className="rounded-modal border border-accent-1/20 bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-text-2">
              {isMm ? 'လာမည့်သတိပေးချက်များ' : 'Upcoming Reminders'}
            </p>
            <button
              type="button"
              onClick={() => void addReminder()}
              disabled={!coupleId}
              className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-3 py-2 text-sm text-text-1 transition hover:bg-card-hover active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> {isMm ? 'ထည့်ရန်' : 'Add'}
            </button>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={isMm ? 'သတိပေးချက် ခေါင်းစဉ်' : 'Reminder title'}
              className="rounded-input border border-border bg-soft-tint px-3 py-2 text-sm text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
            />
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={isMm ? 'စာတို' : 'Message (optional)'}
              className="rounded-input border border-border bg-soft-tint px-3 py-2 text-sm text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
            />
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="rounded-input border border-border bg-soft-tint px-3 py-2 text-sm text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
            />
          </div>

          <div className="space-y-3">
            {isLoading && (
              <p className="text-sm text-text-2">
                {isMm ? 'သတိပေးချက်များကို ဖတ်နေသည်…' : 'Loading reminders…'}
              </p>
            )}
            {!isLoading && reminders.length === 0 && (
              <p className="text-sm text-text-2">
                {isMm ? 'သိမ်းထားသော သတိပေးချက် မရှိသေးပါ။' : 'No saved reminders yet.'}
              </p>
            )}
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="rounded-card border border-border bg-card p-4 transition hover:border-accent-1/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-text-1">{reminder.title}</p>
                    <p className="mt-1 text-sm text-text-2">{reminder.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleToggle(reminder)}
                    className={`rounded-pill px-3 py-1 text-xs font-medium transition ${
                      reminder.enabled ? 'bg-success/15 text-success' : 'bg-soft-tint text-text-2'
                    }`}
                  >
                    {reminder.enabled
                      ? isMm
                        ? 'ဖွင့်ထားသည်'
                        : 'Active'
                      : isMm
                        ? 'ပိတ်ထားသည်'
                        : 'Paused'}
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
          <div className="rounded-panel border border-accent-2/20 bg-card p-5 shadow-card">
            <p className="text-xs uppercase tracking-[0.2em] text-text-2">
              {isMm ? 'နောက်တစ်ကြိမ် သတိပေးမည့်အချိန်' : 'Next Scheduled Reminder'}
            </p>
            <p className="mt-2 text-2xl font-semibold text-text-1">
              {nextReminder
                ? new Date(nextReminder.scheduled_at).toLocaleString()
                : isMm
                  ? 'လာမည့်သတိပေးချက် မရှိပါ'
                  : 'No upcoming reminders'}
            </p>
          </div>

          <div className="rounded-panel border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3 text-accent-1">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">
                {isMm ? 'အဆင်ပြေသလို သတိပေးရန်' : 'Gentle Reminders'}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-2">
              {isMm
                ? 'သတိပေးချက်များကို ဖိအားမဖြစ်စေဘဲ အချင်းချင်း သတိရစေရန် ဖန်တီးထားပါသည်။'
                : 'Created to keep you thoughtfully connected without adding pressure.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
