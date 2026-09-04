'use client'

import { useState } from 'react'
import { Search, X, Smile, Heart, Laugh, Sparkles } from 'lucide-react'

interface Sticker {
  id: string
  emoji: string
  category: string
  tags: string[]
}

interface StickerPickerProps {
  onStickerSelect: (sticker: Sticker) => void
  onClose: () => void
}

const stickers: Sticker[] = [
  // Emotions
  { id: '1', emoji: '😊', category: 'Emotions', tags: ['happy', 'smile', 'joy'] },
  { id: '2', emoji: '😂', category: 'Emotions', tags: ['laugh', 'funny', 'lol'] },
  { id: '3', emoji: '🥰', category: 'Emotions', tags: ['love', 'cute', 'adore'] },
  { id: '4', emoji: '😍', category: 'Emotions', tags: ['love', 'heart', 'eyes'] },
  { id: '5', emoji: '🤗', category: 'Emotions', tags: ['hug', 'cuddle', 'warm'] },
  { id: '6', emoji: '😘', category: 'Emotions', tags: ['kiss', 'love', 'blow'] },
  { id: '7', emoji: '😜', category: 'Emotions', tags: ['wink', 'playful', 'fun'] },
  { id: '8', emoji: '🤩', category: 'Emotions', tags: ['star', 'amazed', 'wow'] },
  { id: '9', emoji: '😎', category: 'Emotions', tags: ['cool', 'sunglasses', 'swag'] },
  { id: '10', emoji: '🥳', category: 'Emotions', tags: ['party', 'celebrate', 'fun'] },
  { id: '11', emoji: '😢', category: 'Emotions', tags: ['sad', 'cry', 'tear'] },
  { id: '12', emoji: '😭', category: 'Emotions', tags: ['cry', 'sad', 'tears'] },
  { id: '13', emoji: '😤', category: 'Emotions', tags: ['angry', 'mad', 'furious'] },
  { id: '14', emoji: '🥺', category: 'Emotions', tags: ['puppy', 'eyes', 'sad'] },
  { id: '15', emoji: '😴', category: 'Emotions', tags: ['sleep', 'tired', 'rest'] },

  // Love
  { id: '16', emoji: '❤️', category: 'Love', tags: ['heart', 'love', 'red'] },
  { id: '17', emoji: '💕', category: 'Love', tags: ['hearts', 'love', 'pink'] },
  { id: '18', emoji: '💖', category: 'Love', tags: ['sparkle', 'heart', 'love'] },
  { id: '19', emoji: '💗', category: 'Love', tags: ['heart', 'love', 'grow'] },
  { id: '20', emoji: '💘', category: 'Love', tags: ['arrow', 'heart', 'love'] },
  { id: '21', emoji: '💝', category: 'Love', tags: ['ribbon', 'heart', 'gift'] },
  { id: '22', emoji: '💞', category: 'Love', tags: ['hearts', 'love', 'revolving'] },
  { id: '23', emoji: '💓', category: 'Love', tags: ['heartbeat', 'love', 'pulse'] },
  { id: '24', emoji: '💙', category: 'Love', tags: ['blue', 'heart', 'love'] },
  { id: '25', emoji: '💚', category: 'Love', tags: ['green', 'heart', 'love'] },
  { id: '26', emoji: '💛', category: 'Love', tags: ['yellow', 'heart', 'love'] },
  { id: '27', emoji: '💜', category: 'Love', tags: ['purple', 'heart', 'love'] },
  { id: '28', emoji: '💌', category: 'Love', tags: ['letter', 'love', 'mail'] },
  { id: '29', emoji: '💏', category: 'Love', tags: ['kiss', 'love', 'couple'] },
  { id: '30', emoji: '💑', category: 'Love', tags: ['couple', 'love', 'together'] },

  // Funny
  { id: '31', emoji: '🤣', category: 'Funny', tags: ['laugh', 'rofl', 'funny'] },
  { id: '32', emoji: '😹', category: 'Funny', tags: ['cat', 'laugh', 'funny'] },
  { id: '33', emoji: '🤪', category: 'Funny', tags: ['zany', 'funny', 'crazy'] },
  { id: '34', emoji: '😜', category: 'Funny', tags: ['wink', 'tongue', 'funny'] },
  { id: '35', emoji: '🤭', category: 'Funny', tags: ['giggle', 'funny', 'shy'] },
  { id: '36', emoji: '🫠', category: 'Funny', tags: ['melting', 'funny', 'mood'] },
  { id: '37', emoji: '🫢', category: 'Funny', tags: ['facepalm', 'funny', 'oops'] },
  { id: '38', emoji: '🫣', category: 'Funny', tags: ['peek', 'funny', 'shy'] },
  { id: '39', emoji: '🫡', category: 'Funny', tags: ['salute', 'funny', 'respect'] },
  { id: '40', emoji: '🤠', category: 'Funny', tags: ['cowboy', 'funny', 'hat'] },
  { id: '41', emoji: '🥸', category: 'Funny', tags: ['disguise', 'funny', 'glasses'] },
  { id: '42', emoji: '🤡', category: 'Funny', tags: ['clown', 'funny', 'circus'] },
  { id: '43', emoji: '👻', category: 'Funny', tags: ['ghost', 'funny', 'spooky'] },
  { id: '44', emoji: '💀', category: 'Funny', tags: ['skull', 'funny', 'dead'] },
  { id: '45', emoji: '🤖', category: 'Funny', tags: ['robot', 'funny', 'tech'] },

  // Animals
  { id: '46', emoji: '🐱', category: 'Animals', tags: ['cat', 'kitten', 'pet'] },
  { id: '47', emoji: '🐶', category: 'Animals', tags: ['dog', 'puppy', 'pet'] },
  { id: '48', emoji: '🐰', category: 'Animals', tags: ['rabbit', 'bunny', 'cute'] },
  { id: '49', emoji: '🐻', category: 'Animals', tags: ['bear', 'cute', 'teddy'] },
  { id: '50', emoji: '🦊', category: 'Animals', tags: ['fox', 'cute', 'orange'] },
  { id: '51', emoji: '🐼', category: 'Animals', tags: ['panda', 'cute', 'bamboo'] },
  { id: '52', emoji: '🐨', category: 'Animals', tags: ['koala', 'cute', 'australia'] },
  { id: '53', emoji: '🦁', category: 'Animals', tags: ['lion', 'king', 'roar'] },
  { id: '54', emoji: '🐯', category: 'Animals', tags: ['tiger', 'stripes', 'wild'] },
  { id: '55', emoji: '🐸', category: 'Animals', tags: ['frog', 'green', 'hop'] },
  { id: '56', emoji: '🐵', category: 'Animals', tags: ['monkey', 'banana', 'fun'] },
  { id: '57', emoji: '🦄', category: 'Animals', tags: ['unicorn', 'magic', 'rainbow'] },
  { id: '58', emoji: '🦋', category: 'Animals', tags: ['butterfly', 'fly', 'beautiful'] },
  { id: '59', emoji: '🐝', category: 'Animals', tags: ['bee', 'honey', 'buzz'] },
  { id: '60', emoji: '🐞', category: 'Animals', tags: ['ladybug', 'red', 'cute'] },

  // Celebration
  { id: '61', emoji: '🎉', category: 'Celebration', tags: ['party', 'celebrate', 'confetti'] },
  { id: '62', emoji: '🎊', category: 'Celebration', tags: ['party', 'celebrate', 'popper'] },
  { id: '63', emoji: '🎈', category: 'Celebration', tags: ['balloon', 'party', 'fun'] },
  { id: '64', emoji: '🎁', category: 'Celebration', tags: ['gift', 'present', 'box'] },
  { id: '65', emoji: '🎂', category: 'Celebration', tags: ['cake', 'birthday', 'candle'] },
  { id: '66', emoji: '🎆', category: 'Celebration', tags: ['firework', 'celebrate', 'boom'] },
  { id: '67', emoji: '🎇', category: 'Celebration', tags: ['sparkler', 'celebrate', 'light'] },
  { id: '68', emoji: '🏆', category: 'Celebration', tags: ['trophy', 'winner', 'gold'] },
  { id: '69', emoji: '🥇', category: 'Celebration', tags: ['gold', 'medal', 'first'] },
  { id: '70', emoji: '🌟', category: 'Celebration', tags: ['star', 'sparkle', 'glow'] },
  { id: '71', emoji: '✨', category: 'Celebration', tags: ['sparkles', 'magic', 'shine'] },
  { id: '72', emoji: '🎵', category: 'Celebration', tags: ['music', 'note', 'song'] },
  { id: '73', emoji: '🎶', category: 'Celebration', tags: ['music', 'notes', 'melody'] },
  { id: '74', emoji: '🎤', category: 'Celebration', tags: ['microphone', 'sing', 'karaoke'] },
  { id: '75', emoji: '🎸', category: 'Celebration', tags: ['guitar', 'music', 'rock'] },
]

const categories = ['All', 'Emotions', 'Love', 'Funny', 'Animals', 'Celebration']

const categoryIcons: Record<string, any> = {
  All: Sparkles,
  Emotions: Smile,
  Love: Heart,
  Funny: Laugh,
  Animals: Heart,
  Celebration: Sparkles,
}

export default function StickerPicker({ onStickerSelect, onClose }: StickerPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredStickers = stickers.filter((sticker) => {
    const matchesSearch = sticker.tags.some((tag) =>
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const matchesCategory = selectedCategory === 'All' || sticker.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[80vh] rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] shadow-[0_20px_40px_rgba(19,10,33,0.28)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--accent-1)]/20 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--accent-1)]" />
            <h2 className="text-lg font-serif text-[var(--text-primary)]">Stickers</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--accent-1)]/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stickers..."
              className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/50"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 p-4 border-b border-[var(--accent-1)]/20 overflow-x-auto">
          {categories.map((category) => {
            const Icon = categoryIcons[category]
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  selectedCategory === category
                    ? 'bg-[var(--accent-1)] text-[var(--bg-color)]'
                    : 'bg-[var(--card-bg-strong)] text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                {category}
              </button>
            )
          })}
        </div>

        {/* Sticker Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-3">
            {filteredStickers.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                onClick={() => onStickerSelect(sticker)}
                className="aspect-square rounded-xl border-2 border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] hover:border-[var(--accent-1)]/50 hover:bg-[var(--accent-1)]/10 transition flex items-center justify-center text-4xl"
              >
                {sticker.emoji}
              </button>
            ))}
          </div>
          {filteredStickers.length === 0 && (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              <p>No stickers found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--accent-1)]/20 p-4 text-center text-xs text-[var(--text-secondary)]">
          {filteredStickers.length} stickers available
        </div>
      </div>
    </div>
  )
}
