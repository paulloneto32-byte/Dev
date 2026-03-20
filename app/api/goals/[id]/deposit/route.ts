import { NextResponse } from "next/server"
import { getUserId } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()

  const { id } = await params
  const body = await request.json()
  const { amount } = body

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Valor do depósito inválido" }, { status: 400 })
  }

  const goal = await prisma.goal.findUnique({ where: { id, userId } })
  if (!goal) return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 })

  const newAmount = goal.currentAmount + amount
  const isCompleted = newAmount >= goal.targetAmount

  const updatedGoal = await prisma.goal.update({
    where: { id },
    data: { currentAmount: newAmount, isCompleted },
    include: { account: true },
  })
  return NextResponse.json(updatedGoal)
}
