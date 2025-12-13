import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valor do depósito inválido" },
        { status: 400 }
      )
    }

    const goal = await prisma.goal.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!goal) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      )
    }

    const newAmount = goal.currentAmount + amount
    const isCompleted = newAmount >= goal.targetAmount

    const updatedGoal = await prisma.goal.update({
      where: {
        id: params.id,
      },
      data: {
        currentAmount: newAmount,
        isCompleted,
      },
      include: {
        account: true,
      },
    })

    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error("Erro ao depositar na meta:", error)
    return NextResponse.json(
      { error: "Erro ao depositar na meta" },
      { status: 500 }
    )
  }
}
