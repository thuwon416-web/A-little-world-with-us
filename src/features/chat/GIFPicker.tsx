'use client'

import { useState, useEffect } from 'react'
import { Search, X, Sparkles, TrendingUp } from 'lucide-react'

interface GIF {
  id: string
  url: string
  title: string
}

interface GIFPickerProps {
  onGIFSelect: (gif: GIF) => void
  onClose: () => void
}

// Note: Replace with your actual Giphy API key
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'dc6zaTOxFJmzC' // Public beta key

export default function GIFPicker({ onGIFSelect, onClose }: GIFPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [gifs, setGifs] = useState<GIF[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchGIFs = async (query: string) => {
    setLoading(true)
    setError(null)

    try {
      const endpoint = query === 'trending'
        ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=g`
        : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g`

      const response = await fetch(endpoint)
      const data = await response.json()

      if (data.data) {
        const formattedGIFs: GIF[] = data.data.map((gif: any) => ({
          id: gif.id,
          url: gif.images.downsized_medium?.url || gif.images.original?.url,
          title: gif.title,
        }))
        setGifs(formattedGIFs)
      }
    } catch (err) {
      console.error('GIF search error:', err)
      setError('Failed to load GIFs. Please try again.')
      // Fallback to mock data if API fails
      setGifs(getMockGIFs())
    } finally {
      setLoading(false)
    }
  }

  const getMockGIFs = (): GIF[] => {
    // Mock GIFs for when API is unavailable
    return [
      { id: 'mock1', url: 'https://media.giphy.com/media/l3q2zQ6q4F38i/giphy.gif', title: 'Happy' },
      { id: 'mock2', url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif', title: 'Love' },
      { id: 'mock3', url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif', title: 'Funny' },
      { id: 'mock4', url: 'https://media.giphy.com/media/26tn33aiTIgxJrTEA/giphy.gif', title: 'Cute' },
      { id: 'mock5', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', title: 'Party' },
      { id: 'mock6', url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', title: 'Wow' },
    ]
  }

  useEffect(() => {
    searchGIFs('trending')
  }, [])

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchGIFs(searchTerm)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[80vh] rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] shadow-[0_20px_40px_rgba(19,10,33,0.28)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--accent-1)]/20 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--accent-1)]" />
            <h2 className="text-lg font-serif text-[var(--text-primary)]">GIFs</h2>
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
              onKeyPress={handleKeyPress}
              placeholder="Search GIFs..."
              className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/50"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-[var(--accent-1)] text-[var(--bg-color)] text-xs font-medium hover:opacity-90 transition"
            >
              Search
            </button>
          </div>
        </div>

        {/* Trending Button */}
        <div className="p-4 border-b border-[var(--accent-1)]/20">
          <button
            type="button"
            onClick={() => {
              setSearchTerm('')
              searchGIFs('trending')
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-2)]/10 text-[var(--accent-2)] hover:bg-[var(--accent-2)]/20 transition"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">View Trending GIFs</span>
          </button>
        </div>

        {/* GIF Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--accent-1)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Loading GIFs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-secondary)]">{error}</p>
              <button
                type="button"
                onClick={() => searchGIFs('trending')}
                className="mt-2 px-4 py-2 rounded-lg bg-[var(--accent-1)] text-[var(--bg-color)] text-sm font-medium hover:opacity-90 transition"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => onGIFSelect(gif)}
                  className="aspect-square rounded-xl overflow-hidden border-2 border-[var(--accent-1)]/20 hover:border-[var(--accent-1)]/50 transition"
                >
                  <img
                    src={gif.url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
          {!loading && !error && gifs.length === 0 && (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              <p>No GIFs found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--accent-1)]/20 p-4 text-center text-xs text-[var(--text-secondary)]">
          {gifs.length} GIFs available • Powered by Giphy
        </div>
      </div>
    </div>
  )
}
