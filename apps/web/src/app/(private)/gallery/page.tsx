import { redirect } from 'next/navigation'

// Memories is the single source of truth for shared photos, Drive imports,
// place metadata, and saved moments. Keep the legacy Gallery URL as an alias
// so users do not land in the old storage-bucket-only gallery.
export default function GalleryPage() {
  redirect('/memories')
}
