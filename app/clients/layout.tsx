// app/clients/layout.tsx
import BottomNav from '@/components/layout/BottomNav'

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <main>{children}</main>
      <BottomNav />
    </div>
  )
}
