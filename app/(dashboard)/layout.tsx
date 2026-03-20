import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={{ name: 'Usuário', email: 'demo@finance.app' }} />
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-16 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
