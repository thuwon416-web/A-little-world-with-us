'use client'

import { useState } from 'react'
import { MapPin, Heart, Calendar, Image as ImageIcon, Plus } from 'lucide-react'

interface Memory {
  id: string
  title: string
  description?: string
  lat: number
  lng: number
  photo_url?: string
  created_at: string
}

interface MemoryMapProps {
  memories?: Memory[]
  onAddMemory?: (memory: Omit<Memory, 'id' | 'created_at'>) => void
}

export default function MemoryMap({ memories = [], onAddMemory }: MemoryMapProps) {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMemory, setNewMemory] = useState({
    title: '',
    description: '',
    lat: 16.8661,
    lng: 96.1951,
    photo_url: '',
  })

  const handleAddMemory = () => {
    onAddMemory?.(newMemory)
    setShowAddForm(false)
    setNewMemory({
      title: '',
      description: '',
      lat: 16.8661,
      lng: 96.1951,
      photo_url: '',
    })
  }

  const sortedMemories = [...memories].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Memory Map</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{memories.length} places</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-lg border border-[var(--accent-1)]/20 px-3 py-2 text-sm text-[var(--accent-1)] transition hover:bg-[var(--accent-1)]/10"
        >
          <Plus className="h-4 w-4" />
          Add Memory
        </button>
      </div>

      {/* Add Memory Form */}
      {showAddForm && (
        <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
          <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Add New Memory</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Title</label>
              <input
                type="text"
                value={newMemory.title}
                onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                placeholder="e.g., First date, Anniversary dinner"
                className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Description</label>
              <textarea
                value={newMemory.description}
                onChange={(e) => setNewMemory({ ...newMemory, description: e.target.value })}
                placeholder="What happened here?"
                rows={2}
                className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={newMemory.lat}
                  onChange={(e) => setNewMemory({ ...newMemory, lat: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={newMemory.lng}
                  onChange={(e) => setNewMemory({ ...newMemory, lng: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Photo URL</label>
              <input
                type="url"
                value={newMemory.photo_url}
                onChange={(e) => setNewMemory({ ...newMemory, photo_url: e.target.value })}
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddMemory}
                className="flex-1 rounded-lg bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)] transition hover:opacity-90"
              >
                Add Memory
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border border-[var(--accent-1)]/20 px-4 py-2 text-sm text-[var(--text-primary)] transition hover:bg-[var(--accent-1)]/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Placeholder with Markers */}
      <div className="relative h-[300px] overflow-hidden rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,107,157,0.15),_rgba(0,0,0,0)_48%),linear-gradient(135deg,_#21162e,_#15263d_55%,_#201437)]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Memory Markers */}
        {sortedMemories.map((memory, _index) => (
          <div
            key={memory.id}
            className="absolute cursor-pointer group"
            style={{
              left: `${20 + (_index * 15) % 60}%`,
              top: `${20 + (_index * 12) % 60}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => setSelectedMemory(memory)}
          >
            <div className="relative">
              <div className="h-4 w-4 rounded-full border-4 border-[var(--accent-1)] bg-white shadow-[0_0_15px_rgba(255,107,157,0.8)]" />
              {memory.photo_url && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full border-2 border-white overflow-hidden shadow-lg">
                  <img
                    src={memory.photo_url}
                    alt={memory.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Center point */}
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--accent-2)] bg-white shadow-[0_0_15px_rgba(255,182,193,0.8)]" />
      </div>

      {/* Selected Memory Details */}
      {selectedMemory && (
        <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
          <div className="flex items-start gap-3">
            {selectedMemory.photo_url ? (
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                  src={selectedMemory.photo_url}
                  alt={selectedMemory.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent-1)]/15 text-[var(--accent-1)]">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-sm font-medium text-[var(--text-primary)]">{selectedMemory.title}</h4>
              {selectedMemory.description && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{selectedMemory.description}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <MapPin className="h-3 w-3" />
                <span>{selectedMemory.lat.toFixed(4)}, {selectedMemory.lng.toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Calendar className="h-3 w-3" />
                <span>{new Date(selectedMemory.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMemory(null)}
              className="rounded-lg p-1 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] hover:bg-[var(--accent-1)]/10"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Memory List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {sortedMemories.map((memory) => (
          <div
            key={memory.id}
            onClick={() => setSelectedMemory(memory)}
            className="flex items-center gap-3 rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 cursor-pointer transition hover:bg-[var(--accent-1)]/10"
          >
            {memory.photo_url ? (
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                  src={memory.photo_url}
                  alt={memory.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent-1)]/15 text-[var(--accent-1)]">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{memory.title}</p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {new Date(memory.created_at).toLocaleDateString()}
              </p>
            </div>
            <MapPin className="h-4 w-4 text-[var(--text-secondary)] flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
