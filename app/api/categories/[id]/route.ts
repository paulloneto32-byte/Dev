import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { name, type, color, icon, parentId } = body

  const category = await prisma.category.update({
    where: { id, userId: session.user.id },
    data: {
      ...(name && { name }),
      ...(type && { type }),
      ...(color && { color }),
      ...(icon && { icon }),
      ...(parentId !== undefined && { parentId }),
    },
    include: { subcategories: true },
  })
  return NextResponse.json(category)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  await prisma.category.delete({ where: { id, userId: session.user.id } })
  return NextResponse.json({ message: "Categoria excluída com sucesso" })
}
