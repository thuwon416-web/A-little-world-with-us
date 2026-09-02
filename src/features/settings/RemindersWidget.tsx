'use client'

import { useState, useEffect } from 'react'
import { Bell, Plus, X, Calendar } from 'lucide-react'
import { insertRow, readUserRows, deleteRow, type Reminder } from '@/lib/supabase'

interface DisplayReminder {
  id: string
  title: string
  description: string | null
  reminder_date: string
  reminder_type: 'custom' | 'anniversary' | 'birthday' | 'cycle' | 'medication'
  repeat_interval: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
}

export default function RemindersWidget() {
  const [reminders, setReminders] = useState<DisplayReminder[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newType, setNewType] = useState<'custom' | 'anniversary' | 'birthday' | 'cycle' | 'medication'>('custom')
  const [newRepeat, setNewRepeat] = useState<'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('once')

  useEffect(() => {
    loadReminders()
  }, [])

  const loadReminders = async () => {
    const data = await readUserRows<Reminder>('reminders', '*', {
      column: 'reminder_date',
      ascending: true,
    })
    setReminders(data as unknown as DisplayReminder[])
  }

  const handleAdd = async () => {
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
    setShowAddModal(false)
    loadReminders()
  }

  const handleDelete = async (id: string) => {
    await deleteRow('reminders', id)
    loadReminders()
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-[var(--accent-1)]" />
        Reminders
      </h3>

      <div className="space-y-2 mb-4">
        {reminders.map(reminder => (
          <div
            key={reminder.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-2)] p-3"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--accent-1)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {reminder.title}
                </p>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {reminder.reminder_date}
                {reminder.repeat_interval && ` • ${reminder.repeat_interval}`}
              </p>
              {reminder.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {reminder.description}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDelete(reminder.id)}
              className="p-2 text-[var(--text-secondary)] hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {reminders.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)] text-center py-4">
            No reminders yet
          </p>
        )}
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="w-full rounded-xl border border-dashed border-[var(--accent-1)]/30 bg-[var(--bg-2)] px-3 py-3 text-sm text-[var(--text-secondary)] flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Reminder
      </button>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Add Reminder
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--text-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="e.g., Anniversary"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">Date *</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'custom' | 'anniversary' | 'birthday' | 'cycle' | 'medication')}
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <option value="custom">Custom</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="birthday">Birthday</option>
                  <option value="cycle">Cycle</option>
                  <option value="medication">Medication</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">Repeat</label>
                <select
                  value={newRepeat}
                  onChange={(e) => setNewRepeat(e.target.value as 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly')}
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <button
                onClick={handleAdd}
                disabled={!newTitle.trim() || !newDate}
                className="w-full rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
              >
                Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
