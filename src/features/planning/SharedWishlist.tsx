'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, ShieldCheck } from 'lucide-react'

type WishlistItem = {
  id: number
  name: string
  price: number
  link: string
  reservedBy: string | null
  secret: boolean
}

const starterItems: WishlistItem[] = [
  {
    id: 1,
    name: 'A weekend getaway under the stars',
    price: 180,
    link: '#',
    reservedBy: null,
    secret: false,
  },
  {
    id: 2,
    name: 'A custom framed photo of us',
    price: 60,
    link: '#',
    reservedBy: 'you',
    secret: false,
  },
  {
    id: 3,
    name: 'Secret surprise for the future',
    price: 120,
    link: '#',
    reservedBy: null,
    secret: true,
  },
]

export default function SharedWishlist() {
  const [items, setItems] = useState<WishlistItem[]>(starterItems)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('120')
  const [link, setLink] = useState('')
  const [secret, setSecret] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('our-forever-wishlist')
    if (stored) setItems(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem('our-forever-wishlist', JSON.stringify(items))
  }, [items])

  const reserveItem = (id: number, partner: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, reservedBy: item.reservedBy ? null : partner } : item
      )
    )
  }

  const addItem = () => {
    if (!name.trim()) return
    const newItem: WishlistItem = {
      id: Date.now(),
      name: name.trim(),
      price: Number(price) || 0,
      link: link.trim() || '#',
      reservedBy: null,
      secret,
    }
    setItems((prev) => [newItem, ...prev])
    setName('')
    setPrice('120')
    setLink('')
    setSecret(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Gift className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Shared Wishlist</h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -2 }}
            className="rounded-2xl bg-[var(--card-bg)] p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-[var(--text-primary)]">
                  {item.secret ? 'Secret gift' : item.name}
                </div>
                <div className="text-[11px] opacity-60">
                  ${item.price} • {item.secret ? 'Hidden from view' : 'Visible to both'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => reserveItem(item.id, 'you')}
                className="glass-button px-3 py-2 text-[10px]"
              >
                {item.reservedBy ? 'Unreserve' : 'Reserve'}
              </button>
            </div>
            {item.reservedBy && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--accent-1)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Reserved by {item.reservedBy}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Gift idea"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-sm outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-sm outline-none"
          />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link"
            className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-sm outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} />
          Secret gift
        </label>
        <button onClick={addItem} className="glass-button w-full text-sm">
          Add to wishlist
        </button>
      </div>
    </div>
  )
}
