"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  PieChart,
} from "lucide-react"

const mobileItems = [
  { title: "Início", href: "/dashboard", icon: LayoutDashboard },
  { title: "Transações", href: "/transactions", icon: ArrowLeftRight },
  { title: "Contas", href: "/accounts", icon: Wallet },
  { title: "Metas", href: "/goals", icon: Target },
  { title: "Orçamentos", href: "/budgets", icon: PieChart },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {mobileItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors",
                isActive ? "text-primary" : "text-gray-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
