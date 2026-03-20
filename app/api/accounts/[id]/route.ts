import { NextResponse } from "next/server"
import { getUserId } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()

  const { id } = await params
  const account = await prisma.bankAccount.findUnique({ where: { id, userId } })
  if (!account) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
  return NextResponse.json(account)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()

  const { id } = await params
  const body = await request.json()
  const { name, type, balance, color, icon, isActive } = body

  const account = await prisma.bankAccount.update({
    where: { id, userId },
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
  const userId = await getUserId()

  const { id } = await params
  await prisma.bankAccount.delete({ where: { id, userId } })
  return NextResponse.json({ message: "Conta excluída com sucesso" })
}
