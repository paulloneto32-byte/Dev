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
  const { name, type, color, icon, parentId } = body

  const category = await prisma.category.update({
    where: { id, userId },
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
  const userId = await getUserId()

  const { id } = await params
  await prisma.category.delete({ where: { id, userId } })
  return NextResponse.json({ message: "Categoria excluída com sucesso" })
}
