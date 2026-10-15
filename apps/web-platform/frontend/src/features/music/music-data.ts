import type { MusicMood, MusicTrack } from './music-types'

export interface MoodBoard {
  id: MusicMood
  label: string
  description: string
  accent: string
  tracks: MusicTrack[]
}

export const moodBoard: MoodBoard[] = [
  {
    id: 'romantic',
    label: 'Soft & romantic',
    description: 'Warm songs for slow evenings and close conversations.',
    accent: 'from-rose-400/30 to-pink-500/10',
    tracks: [
      { youtubeId: '450p7goxZqg', title: 'Kiss Me', artist: 'Sixpence None the Richer', duration: '3:30', mood: 'romantic' },
      { youtubeId: '3JWTaaS7LdU', title: 'All of Me', artist: 'John Legend', duration: '4:29', mood: 'romantic' },
      { youtubeId: 'lp-EO5I60KA', title: 'Thinking Out Loud', artist: 'Ed Sheeran', duration: '4:41', mood: 'romantic' },
    ],
  },
  {
    id: 'happy',
    label: 'Bright & happy',
    description: 'A little lift for dancing in the kitchen together.',
    accent: 'from-amber-400/30 to-orange-500/10',
    tracks: [
      { youtubeId: 'ZbZSe6N_BXs', title: 'Happy', artist: 'Pharrell Williams', duration: '3:53', mood: 'happy' },
      { youtubeId: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', duration: '4:30', mood: 'happy' },
      { youtubeId: 'ru0K8uYEZWw', title: 'Can’t Stop the Feeling!', artist: 'Justin Timberlake', duration: '4:01', mood: 'happy' },
    ],
  },
  {
    id: 'chill',
    label: 'Slow & chill',
    description: 'Low-key soundtracks for quiet mornings and rainy days.',
    accent: 'from-sky-400/30 to-cyan-500/10',
    tracks: [
      { youtubeId: '5qap5aO4i9A', title: 'lofi hip hop radio', artist: 'Lofi Girl', duration: 'Live', mood: 'chill' },
      { youtubeId: 'DWcJFNfaw9c', title: 'Coffee shop radio', artist: 'Chillhop Music', duration: 'Live', mood: 'chill' },
      { youtubeId: 'hHW1oY26kxQ', title: 'Peaceful Piano', artist: 'Soothing Relaxation', duration: 'Live', mood: 'chill' },
    ],
  },
  {
    id: 'sad',
    label: 'Tender & sad',
    description: 'Gentle songs for naming and holding difficult feelings.',
    accent: 'from-blue-400/30 to-indigo-500/10',
    tracks: [
      { youtubeId: 'RgKAFK5djSk', title: 'See You Again', artist: 'Wiz Khalifa ft. Charlie Puth', duration: '3:58', mood: 'sad' },
      { youtubeId: 'hLQl3WQQoQ0', title: 'Someone Like You', artist: 'Adele', duration: '4:45', mood: 'sad' },
      { youtubeId: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele', duration: '4:55', mood: 'sad' },
    ],
  },
]

export const moodBoardTracks = moodBoard.flatMap((mood) => mood.tracks)
