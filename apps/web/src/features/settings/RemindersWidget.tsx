'use client'

import { useState, useEffect, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X, Calendar } from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import { insertRow, readUserRows, deleteRow, getCurrentUserId, type Reminder } from '@/lib/supabase'
import { EmptyState } from '@/components/ui/empty-state'

type DisplayReminder = Pick<
  Reminder,
  'id' | 'title' | 'description' | 'reminder_date' | 'reminder_type' | 'repeat_interval'
>

const REMINDER_TYPES: DisplayReminder['reminder_type'][] = [
  'custom',
  'anniversary',
  'birthday',
  'cycle',
  'medication',
]
const REPEAT_INTERVALS: Exclude<DisplayReminder['repeat_interval'], null | undefined>[] = [
  'once',
  'daily',
  'weekly',
  'monthly',
  'yearly',
]

export default function RemindersWidget({
  modalBlocked,
  onModalOpen,
  onModalClose,
}: {
  modalBlocked: boolean
  onModalOpen: () => void
  onModalClose: () => void
}) {
  const fieldId = useId()
  const [reminders, setReminders] = useState<DisplayReminder[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newType, setNewType] = useState<'custom' | 'anniversary' | 'birthday' | 'cycle' | 'medication'>('custom')
  const [newRepeat, setNewRepeat] = useState<'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('once')

  const closeModal = () => {
    setShowAddModal(false)
    onModalClose()
  }

  const loadReminders = useCallback(async (): Promise<void> => {
    const data = await readUserRows<DisplayReminder>('reminders', '*', {
      column: 'reminder_date',
      ascending: true,
    })
    setReminders(data)
  }, [])

  useEffect(() => {
    void loadReminders()
  }, [loadReminders])

  const handleAdd = async (): Promise<void> => {
    if (!newTitle.trim() || !newDate) return

    await insertRow('reminders', {
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      reminder_date: newDate,
      reminder_type: newType,
      repeat_interval: newRepeat,
    })

    setNewTitle('')
    setNewDescription('')
    setNewDate('')
    setNewType('custom')
    setNewRepeat('once')
    closeModal()
    await loadReminders()
  }

  const handleDelete = async (id: string): Promise<void> => {
    const userId = await getCurrentUserId()
    if (!userId) return
    await deleteRow('reminders', id, userId)
    await loadReminders()
  }

  const modal = showAddModal ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="add-reminder-title">
      <div className="my-8 w-full max-w-md rounded-modal border border-accent-1/20 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text-2">Shared reminders</p>
            <h3 id="add-reminder-title" className="mt-1 text-lg font-semibold text-text-1">Add Reminder</h3>
          </div>
          <button type="button" onClick={closeModal} className="rounded-full p-2 text-text-2 transition hover:bg-soft-tint hover:text-text-1" aria-label="Close add reminder">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div><label htmlFor={`${fieldId}-title`} className="text-sm font-medium text-text-1">Title *</label><input id={`${fieldId}-title`} type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-3 text-sm text-text-1 outline-none focus:border-accent-1/50 focus:ring-2 focus:ring-accent-1/15" placeholder="e.g., Anniversary" autoFocus /></div>
          <div><label htmlFor={`${fieldId}-description`} className="text-sm font-medium text-text-1">Description</label><textarea id={`${fieldId}-description`} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="mt-2 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-3 text-sm text-text-1 outline-none focus:border-accent-1/50 focus:ring-2 focus:ring-accent-1/15" placeholder="Additional notes..." rows={2} /></div>
          <div><label htmlFor={`${fieldId}-date`} className="text-sm font-medium text-text-1">Date *</label><input id={`${fieldId}-date`} type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="mt-2 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-3 text-sm text-text-1 outline-none focus:border-accent-1/50 focus:ring-2 focus:ring-accent-1/15" /></div>
          <div><label htmlFor={`${fieldId}-type`} className="text-sm font-medium text-text-1">Type</label><select id={`${fieldId}-type`} value={newType} onChange={(event) => { const value = REMINDER_TYPES.find((type) => type === event.target.value); if (value) setNewType(value) }} className="mt-2 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-3 text-sm text-text-1 outline-none focus:border-accent-1/50 focus:ring-2 focus:ring-accent-1/15"><option value="custom">Custom</option><option value="anniversary">Anniversary</option><option value="birthday">Birthday</option><option value="cycle">Cycle</option><option value="medication">Medication</option></select></div>
          <div><label htmlFor={`${fieldId}-repeat`} className="text-sm font-medium text-text-1">Repeat</label><select id={`${fieldId}-repeat`} value={newRepeat} onChange={(event) => { const value = REPEAT_INTERVALS.find((interval) => interval === event.target.value); if (value) setNewRepeat(value) }} className="mt-2 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-3 text-sm text-text-1 outline-none focus:border-accent-1/50 focus:ring-2 focus:ring-accent-1/15"><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
          <button type="button" onClick={handleAdd} disabled={!newTitle.trim() || !newDate} className="w-full rounded-xl bg-accent-1 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">Add Reminder</button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-text-1 mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-accent-1" />
        Reminders
      </h3>

      <div className="space-y-2 mb-4">
        {reminders.map(reminder => (
          <div
            key={reminder.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-soft-tint p-3"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent-1" />
                <p className="text-sm font-medium text-text-1">
                  {reminder.title}
                </p>
              </div>
              <p className="text-xs text-text-2 mt-1">
                {reminder.reminder_date}
                {reminder.repeat_interval && ` • ${reminder.repeat_interval}`}
              </p>
              {reminder.description && (
                <p className="text-xs text-text-2 mt-1">
                  {reminder.description}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDelete(reminder.id)}
              className="p-2 text-text-2 hover:text-error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {reminders.length === 0 && (
          <EmptyState
            icon={Bell}
            title="No reminders yet"
            description="Create one to keep your connection on track."
          />
        )}
      </div>

      <button
        onClick={() => {
          setShowAddModal(true)
          onModalOpen()
        }}
        disabled={modalBlocked}
        className="w-full rounded-xl border border-dashed border-accent-1/30 bg-soft-tint px-3 py-3 text-sm text-text-2 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <AnimatedIcon name="Plus" animation="pulse" trigger="hover" size={16} />
        Add Reminder
      </button>

      {typeof document !== 'undefined' && modal ? createPortal(modal, document.body) : null}

    </div>
  )
}
