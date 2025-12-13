import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7)

    const date = new Date(month)
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    // Buscar todas as contas do usuário
    const accounts = await prisma.bankAccount.findMany({
      where: { userId: session.user.id },
    })

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

    // Transações do mês
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      include: {
        category: true,
      },
    })

    const totalIncome = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyBalance = totalIncome - totalExpense

    // Despesas por categoria
    const expensesByCategory = transactions
      .filter((t) => t.type === "EXPENSE" && t.category)
      .reduce((acc, t) => {
        const categoryName = t.category!.name
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            value: 0,
            color: t.category!.color,
          }
        }
        acc[categoryName].value += t.amount
        return acc
      }, {} as Record<string, { name: string; value: number; color: string }>)

    const categoryData = Object.values(expensesByCategory)

    // Últimas 5 transações
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: "desc" },
      take: 5,
    })

    // Evolução mensal (últimos 6 meses)
    const monthlyEvolution = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - i)
      const monthFirst = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthLast = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

      const monthTransactions = await prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: monthFirst,
            lte: monthLast,
          },
        },
      })

      const income = monthTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0)

      const expense = monthTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0)

      monthlyEvolution.push({
        month: monthDate.toLocaleDateString("pt-BR", { month: "short" }),
        receitas: income,
        despesas: expense,
        saldo: income - expense,
      })
    }

    return NextResponse.json({
      totalBalance,
      totalIncome,
      totalExpense,
      monthlyBalance,
      categoryData,
      recentTransactions,
      monthlyEvolution,
      accountsCount: accounts.length,
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    )
  }
}
