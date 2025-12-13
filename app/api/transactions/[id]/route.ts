import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { accountId, categoryId, amount, date, description, type } = body

    // Buscar transação original para ajustar saldo
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id: params.id, userId: session.user.id },
    })

    if (!originalTransaction) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      )
    }

    // Reverter saldo original
    if (originalTransaction.type === "EXPENSE") {
      await prisma.bankAccount.update({
        where: { id: originalTransaction.accountId },
        data: { balance: { increment: originalTransaction.amount } },
      })
    } else {
      await prisma.bankAccount.update({
        where: { id: originalTransaction.accountId },
        data: { balance: { decrement: originalTransaction.amount } },
      })
    }

    // Atualizar transação
    const transaction = await prisma.transaction.update({
      where: { id: params.id, userId: session.user.id },
      data: {
        ...(accountId && { accountId }),
        ...(categoryId !== undefined && { categoryId }),
        ...(amount && { amount }),
        ...(date && { date: new Date(date) }),
        ...(description && { description }),
        ...(type && { type }),
      },
      include: {
        account: true,
        category: true,
      },
    })

    // Aplicar novo saldo
    const newType = type || originalTransaction.type
    const newAmount = amount || originalTransaction.amount
    const newAccountId = accountId || originalTransaction.accountId

    if (newType === "EXPENSE") {
      await prisma.bankAccount.update({
        where: { id: newAccountId },
        data: { balance: { decrement: newAmount } },
      })
    } else {
      await prisma.bankAccount.update({
        where: { id: newAccountId },
        data: { balance: { increment: newAmount } },
      })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Erro ao atualizar transação:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar transação" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar transação para reverter saldo
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id, userId: session.user.id },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      )
    }

    // Reverter saldo
    if (transaction.type === "EXPENSE") {
      await prisma.bankAccount.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: transaction.amount } },
      })
    } else {
      await prisma.bankAccount.update({
        where: { id: transaction.accountId },
        data: { balance: { decrement: transaction.amount } },
      })
    }

    // Excluir transação
    await prisma.transaction.delete({
      where: { id: params.id, userId: session.user.id },
    })

    return NextResponse.json({ message: "Transação excluída com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir transação:", error)
    return NextResponse.json(
      { error: "Erro ao excluir transação" },
      { status: 500 }
    )
  }
}
