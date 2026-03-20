import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'overview'
  const monthParam = searchParams.get('month') || format(new Date(), 'yyyy-MM')
  const months = parseInt(searchParams.get('months') || '6')

  const [year, month] = monthParam.split('-').map(Number)
  const start = startOfMonth(new Date(year, month - 1, 1))
  const end = endOfMonth(new Date(year, month - 1, 1))

  if (type === 'monthly') {
    // Last N months comparison
    const monthlyData = []
    for (let i = months - 1; i >= 0; i--) {
      const d = subMonths(new Date(year, month - 1, 1), i)
      const mStart = startOfMonth(d)
      const mEnd = endOfMonth(d)

      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId: session.user.id, type: 'INCOME', date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId: session.user.id, type: 'EXPENSE', date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true },
        }),
      ])

      monthlyData.push({
        month: format(d, 'MMM/yy'),
        income: income._sum.amount || 0,
        expense: expense._sum.amount || 0,
        balance: (income._sum.amount || 0) - (expense._sum.amount || 0),
      })
    }
    return NextResponse.json(monthlyData)
  }

  if (type === 'categories') {
    // Expense breakdown by category for selected month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: 'EXPENSE',
        date: { gte: start, lte: end },
        categoryId: { not: null },
      },
      include: { category: true },
    })

    const categoryMap = new Map<string, { name: string; color: string; total: number; count: number }>()
    for (const t of transactions) {
      if (!t.category) continue
      const existing = categoryMap.get(t.categoryId!)
      if (existing) {
        existing.total += t.amount
        existing.count++
      } else {
        categoryMap.set(t.categoryId!, {
          name: t.category.name,
          color: t.category.color,
          total: t.amount,
          count: 1,
        })
      }
    }

    const total = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.total, 0)
    const result = Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        id,
        ...data,
        percentage: total > 0 ? (data.total / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({ categories: result, total })
  }

  if (type === 'top-expenses') {
    // Top 10 expenses for the month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: 'EXPENSE',
        date: { gte: start, lte: end },
      },
      include: { category: true, account: true },
      orderBy: { amount: 'desc' },
      take: 10,
    })
    return NextResponse.json(transactions)
  }

  // Overview for month
  const [income, expense, transactionCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: 'INCOME', date: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: 'EXPENSE', date: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.count({
      where: { userId: session.user.id, date: { gte: start, lte: end } },
    }),
  ])

  // Previous month comparison
  const prevStart = startOfMonth(subMonths(start, 1))
  const prevEnd = endOfMonth(subMonths(start, 1))
  const [prevIncome, prevExpense] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: 'INCOME', date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: 'EXPENSE', date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    }),
  ])

  const totalIncome = income._sum.amount || 0
  const totalExpense = expense._sum.amount || 0
  const prevTotalIncome = prevIncome._sum.amount || 0
  const prevTotalExpense = prevExpense._sum.amount || 0

  return NextResponse.json({
    income: totalIncome,
    expense: totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount,
    incomeCount: income._count,
    expenseCount: expense._count,
    prevIncome: prevTotalIncome,
    prevExpense: prevTotalExpense,
    incomeChange: prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0,
    expenseChange: prevTotalExpense > 0 ? ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100 : 0,
  })
}
