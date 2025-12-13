import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

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
        userId: session.user.id,
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
