import AdminLocationsPage from '@/app/(admin)/locations/page'

// This route intentionally lives beneath the private layout so the admin
// location dashboard receives the same desktop sidebar and mobile navigation
// as every other signed-in page.
export default function AdminLocationsRoute() {
  return <AdminLocationsPage />
}
