import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const account = await prisma.bankAccount.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error("Erro ao buscar conta:", error)
    return NextResponse.json(
      { error: "Erro ao buscar conta" },
      { status: 500 }
    )
  }
}

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
    const { name, type, balance, color, icon, isActive } = body

    const account = await prisma.bankAccount.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(balance !== undefined && { balance }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error("Erro ao atualizar conta:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar conta" },
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

    await prisma.bankAccount.delete({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: "Conta excluída com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir conta:", error)
    return NextResponse.json(
      { error: "Erro ao excluir conta" },
      { status: 500 }
    )
  }
}
