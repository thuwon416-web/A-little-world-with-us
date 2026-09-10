export type MusicMood = 'happy' | 'sad' | 'romantic' | 'chill'

export interface SharedPlaylistSong {
  id: string
  coupleId: string
  addedBy: string
  provider: 'youtube' | 'spotify' | 'upload' | 'local'
  externalId: string
  title: string
  artist: string | null
  album: string | null
  thumbnailUrl: string | null
  sourceUrl: string | null
  durationSeconds: number | null
  whyAdded: string | null
  position: number
  isAnniversarySong: boolean
  createdAt: string
  updatedAt: string
}

export interface YouTubePlayerProps {
  videoId: string
  autoplay?: boolean
  onStateChange?: (state: number) => void
  className?: string
  title?: string
}

export interface AddSongFormData {
  youtubeUrlOrId: string
  title: string
  artist: string
  whyAdded: string
}

export interface MusicTrack {
  youtubeId: string
  title: string
  artist: string
  duration?: string
  mood?: MusicMood
  notes?: string
}
