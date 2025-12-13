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
    const month = searchParams.get("month")
    const accountId = searchParams.get("accountId")
    const categoryId = searchParams.get("categoryId")
    const type = searchParams.get("type")

    const where: any = {
      userId: session.user.id,
    }

    if (month) {
      const date = new Date(month)
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      where.date = {
        gte: firstDay,
        lte: lastDay,
      }
    }

    if (accountId) {
      where.accountId = accountId
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (type) {
      where.type = type
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    return NextResponse.json(
      { error: "Erro ao buscar transações" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      accountId,
      categoryId,
      amount,
      date,
      description,
      type,
      isRecurring,
      recurringDay,
      installments,
    } = body

    if (!accountId || !amount || !date || !description || !type) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    // Se for parcelamento, criar múltiplas transações
    if (installments && installments > 1) {
      const installmentGroup = `${Date.now()}-${session.user.id}`
      const transactions = []

      for (let i = 0; i < installments; i++) {
        const installmentDate = new Date(date)
        installmentDate.setMonth(installmentDate.getMonth() + i)

        const transaction = await prisma.transaction.create({
          data: {
            userId: session.user.id,
            accountId,
            categoryId: categoryId || null,
            amount,
            date: installmentDate,
            description: `${description} (${i + 1}/${installments})`,
            type,
            isRecurring: false,
            installments,
            currentInstallment: i + 1,
            installmentGroup,
          },
          include: {
            account: true,
            category: true,
          },
        })

        transactions.push(transaction)

        // Atualizar saldo da conta
        if (type === "EXPENSE") {
          await prisma.bankAccount.update({
            where: { id: accountId },
            data: { balance: { decrement: amount } },
          })
        } else {
          await prisma.bankAccount.update({
            where: { id: accountId },
            data: { balance: { increment: amount } },
          })
        }
      }

      return NextResponse.json(transactions, { status: 201 })
    }

    // Transação única
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        accountId,
        categoryId: categoryId || null,
        amount,
        date: new Date(date),
        description,
        type,
        isRecurring: isRecurring || false,
        recurringDay: recurringDay || null,
      },
      include: {
        account: true,
        category: true,
      },
    })

    // Atualizar saldo da conta
    if (type === "EXPENSE") {
      await prisma.bankAccount.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      })
    } else {
      await prisma.bankAccount.update({
        where: { id: accountId },
        data: { balance: { increment: amount } },
      })
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar transação:", error)
    return NextResponse.json(
      { error: "Erro ao criar transação" },
      { status: 500 }
    )
  }
}
