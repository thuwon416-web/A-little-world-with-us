'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, ExternalLink, Heart, Gift, Tag, Star } from 'lucide-react'
import {
  getFavorites,
  getPartnerFavorites,
  addFavorite,
  deleteFavorite,
  type FavoriteCategory,
  type FavoriteItem,
} from '@/lib/favorites'

const CATEGORIES: { id: FavoriteCategory; label: string; icon: typeof Tag }[] = [
  { id: 'size', label: 'Size', icon: Tag },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'gift_ideas', label: 'Gift Ideas', icon: Gift },
  { id: 'favorites', label: 'Favorites', icon: Star },
]

export default function FavoritesWidget() {
  const [activeCategory, setActiveCategory] = useState<FavoriteCategory>('size')
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [partnerItems, setPartnerItems] = useState<FavoriteItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemValue, setNewItemValue] = useState('')
  const [newItemUrl, setNewItemUrl] = useState('')
  const [newItemNotes, setNewItemNotes] = useState('')

  const loadFavorites = useCallback(async () => {
    const [myItems, partnerItems] = await Promise.all([
      getFavorites(activeCategory),
      getPartnerFavorites(activeCategory),
    ])
    setItems(myItems)
    setPartnerItems(partnerItems)
  }, [activeCategory])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const handleAdd = async () => {
    if (!newItemName.trim()) return

    await addFavorite(
      activeCategory,
      newItemName.trim(),
      newItemValue.trim() || undefined,
      newItemUrl.trim() || undefined,
      newItemNotes.trim() || undefined
    )

    setNewItemName('')
    setNewItemValue('')
    setNewItemUrl('')
    setNewItemNotes('')
    setShowAddModal(false)
    loadFavorites()
  }

  const handleDelete = async (id: string) => {
    await deleteFavorite(id)
    loadFavorites()
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Heart className="h-5 w-5 text-[var(--accent-1)]" />
        Favorites & Gift Data
      </h3>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {CATEGORIES.map((category) => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap ${
                activeCategory === category.id
                  ? 'bg-[var(--button-bg)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-2)] text-[var(--text-secondary)]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </button>
          )
        })}
      </div>

      {/* My Items */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
          Your {activeCategory.replace('_', ' ')}
        </h4>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-2)] p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.item_name}</p>
                {item.item_value && (
                  <p className="text-xs text-[var(--text-secondary)]">{item.item_value}</p>
                )}
                {item.item_url && (
                  <a
                    href={item.item_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--accent-1)] flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Link
                  </a>
                )}
                {item.notes && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{item.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-[var(--text-secondary)] hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)] text-center py-4">No items yet</p>
          )}
        </div>
      </div>

      {/* Partner's Items (if coupled) */}
      {partnerItems.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
            Partner&apos;s {activeCategory.replace('_', ' ')}
          </h4>
          <div className="space-y-2">
            {partnerItems.map((item) => (
              <div key={item.id} className="rounded-xl bg-[var(--bg-2)] p-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.item_name}</p>
                {item.item_value && (
                  <p className="text-xs text-[var(--text-secondary)]">{item.item_value}</p>
                )}
                {item.item_url && (
                  <a
                    href={item.item_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--accent-1)] flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Link
                  </a>
                )}
                {item.notes && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{item.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="mt-4 w-full rounded-xl border border-dashed border-[var(--accent-1)]/30 bg-[var(--bg-2)] px-3 py-3 text-sm text-[var(--text-secondary)] flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Item
      </button>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Add {activeCategory.replace('_', ' ')}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--text-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Name *</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="e.g., T-shirt size"
                />
              </div>

              {activeCategory === 'size' && (
                <div>
                  <label className="text-sm text-[var(--text-secondary)]">Value</label>
                  <input
                    type="text"
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                    placeholder="e.g., M, 38, 75B"
                  />
                </div>
              )}

              {activeCategory !== 'size' && (
                <>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">URL (optional)</label>
                    <input
                      type="url"
                      value={newItemUrl}
                      onChange={(e) => setNewItemUrl(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Notes (optional)</label>
                    <textarea
                      value={newItemNotes}
                      onChange={(e) => setNewItemNotes(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleAdd}
                disabled={!newItemName.trim()}
                className="w-full rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
