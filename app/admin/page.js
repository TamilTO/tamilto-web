import AdminV3 from '@/components/admin/AdminV3'

// The TamilTO admin panel (design: "TamilTO Admin v3"). Sign-in and all data stay in the browser.
export const dynamic = 'force-static'

export default function AdminPage() {
  return <AdminV3 />
}
