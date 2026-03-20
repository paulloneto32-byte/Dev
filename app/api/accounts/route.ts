import { NextResponse } from "next/server"
import { getUserId } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const userId = await getUserId()

    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Erro ao buscar contas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar contas" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId()

    const body = await request.json()
    const { name, type, balance, color, icon } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 }
      )
    }

    const account = await prisma.bankAccount.create({
      data: {
        userId,
        name,
        type,
        balance: balance || 0,
        color: color || "#3b82f6",
        icon: icon || "wallet",
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar conta:", error)
    return NextResponse.json(
      { error: "Erro ao criar conta" },
      { status: 500 }
    )
  }
}
