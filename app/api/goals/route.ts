import { NextResponse } from "next/server"
import { getUserId } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const userId = await getUserId()

    const goals = await prisma.goal.findMany({
      where: { userId },
      include: {
        account: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(goals)
  } catch (error) {
    console.error("Erro ao buscar metas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar metas" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId()

    const body = await request.json()
    const { name, targetAmount, deadline, accountId, color, icon } = body

    if (!name || !targetAmount) {
      return NextResponse.json(
        { error: "Nome e valor objetivo são obrigatórios" },
        { status: 400 }
      )
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        name,
        targetAmount,
        deadline: deadline ? new Date(deadline) : null,
        accountId: accountId || null,
        color: color || "#10b981",
        icon: icon || "target",
      },
      include: {
        account: true,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar meta:", error)
    return NextResponse.json(
      { error: "Erro ao criar meta" },
      { status: 500 }
    )
  }
}
