import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const account = await prisma.bankAccount.findUnique({ where: { id, userId: session.user.id } })
  if (!account) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
  return NextResponse.json(account)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { name, type, balance, color, icon, isActive } = body

  const account = await prisma.bankAccount.update({
    where: { id, userId: session.user.id },
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
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  await prisma.bankAccount.delete({ where: { id, userId: session.user.id } })
  return NextResponse.json({ message: "Conta excluída com sucesso" })
}
