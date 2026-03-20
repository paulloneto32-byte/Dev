import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const budgetSchema = z.object({
  categoryId: z.string(),
  month: z.string(), // "2024-01"
  amount: z.number().positive(),
  rollover: z.boolean().optional().default(false),
})

export async function GET(request: Request) {
  const userId = await getUserId()

  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7)

  const [year, month] = monthParam.split('-').map(Number)
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      month: { gte: startOfMonth, lte: endOfMonth },
    },
    include: { category: true },
    orderBy: { category: { name: 'asc' } },
  })

  // Calculate actual spent for each budget category in the month
  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const transactions = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: 'EXPENSE',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      })
      const spent = transactions._sum.amount || 0
      return { ...budget, spent }
    })
  )

  return NextResponse.json(budgetsWithSpent)
}

export async function POST(request: Request) {
  const userId = await getUserId()

  const body = await request.json()
  const data = budgetSchema.parse(body)

  const [year, month] = data.month.split('-').map(Number)
  const monthDate = new Date(year, month - 1, 1)

  const budget = await prisma.budget.upsert({
    where: {
      userId_categoryId_month: {
        userId,
        categoryId: data.categoryId,
        month: monthDate,
      },
    },
    update: {
      amount: data.amount,
      rollover: data.rollover,
    },
    create: {
      userId,
      categoryId: data.categoryId,
      month: monthDate,
      amount: data.amount,
      rollover: data.rollover,
    },
    include: { category: true },
  })

  return NextResponse.json(budget, { status: 201 })
}
