import { NextResponse } from "next/server"
import { getUserId } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()

  const { id } = await params
  const body = await request.json()
  const { accountId, categoryId, amount, date, description, type } = body

  const originalTransaction = await prisma.transaction.findUnique({
    where: { id, userId },
  })
  if (!originalTransaction) return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })

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

  const transaction = await prisma.transaction.update({
    where: { id, userId },
    data: {
      ...(accountId && { accountId }),
      ...(categoryId !== undefined && { categoryId }),
      ...(amount && { amount }),
      ...(date && { date: new Date(date) }),
      ...(description && { description }),
      ...(type && { type }),
    },
    include: { account: true, category: true },
  })

  // Aplicar novo saldo
  const newType = type || originalTransaction.type
  const newAmount = amount || originalTransaction.amount
  const newAccountId = accountId || originalTransaction.accountId

  if (newType === "EXPENSE") {
    await prisma.bankAccount.update({ where: { id: newAccountId }, data: { balance: { decrement: newAmount } } })
  } else {
    await prisma.bankAccount.update({ where: { id: newAccountId }, data: { balance: { increment: newAmount } } })
  }

  return NextResponse.json(transaction)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()

  const { id } = await params
  const transaction = await prisma.transaction.findUnique({ where: { id, userId } })
  if (!transaction) return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })

  if (transaction.type === "EXPENSE") {
    await prisma.bankAccount.update({ where: { id: transaction.accountId }, data: { balance: { increment: transaction.amount } } })
  } else {
    await prisma.bankAccount.update({ where: { id: transaction.accountId }, data: { balance: { decrement: transaction.amount } } })
  }

  await prisma.transaction.delete({ where: { id, userId } })
  return NextResponse.json({ message: "Transação excluída com sucesso" })
}
