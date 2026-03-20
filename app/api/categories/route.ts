import { NextResponse } from "next/server"
import { getUserId } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const userId = await getUserId()

    const categories = await prisma.category.findMany({
      where: { userId },
      include: {
        subcategories: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId()

    const body = await request.json()
    const { name, type, color, icon, parentId } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        userId,
        name,
        type,
        color: color || "#6b7280",
        icon: icon || "tag",
        parentId: parentId || null,
      },
      include: {
        subcategories: true,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar categoria:", error)
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    )
  }
}
