import { NextResponse } from "next/server"
import { getUserId } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

const defaultCategories = {
  EXPENSE: [
    { name: "Alimentação", color: "#f59e0b", icon: "utensils", subcategories: ["Restaurantes", "Supermercado", "Delivery", "Lanches"] },
    { name: "Transporte", color: "#3b82f6", icon: "car", subcategories: ["Combustível", "Uber/Taxi", "Estacionamento", "Manutenção"] },
    { name: "Moradia", color: "#8b5cf6", icon: "home", subcategories: ["Aluguel", "Condomínio", "Água", "Luz", "Gás", "Internet"] },
    { name: "Lazer", color: "#ec4899", icon: "smile", subcategories: ["Cinema", "Jogos", "Streaming", "Viagens", "Hobbies"] },
    { name: "Saúde", color: "#10b981", icon: "heart", subcategories: ["Médico", "Farmácia", "Academia", "Plano de Saúde"] },
    { name: "Educação", color: "#06b6d4", icon: "book", subcategories: ["Cursos", "Livros", "Material Escolar"] },
    { name: "Vestuário", color: "#f43f5e", icon: "shirt", subcategories: ["Roupas", "Calçados", "Acessórios"] },
    { name: "Outros", color: "#6b7280", icon: "more-horizontal", subcategories: ["Presentes", "Doações", "Diversos"] },
  ],
  INCOME: [
    { name: "Salário", color: "#10b981", icon: "dollar-sign", subcategories: [] },
    { name: "Freelance", color: "#3b82f6", icon: "briefcase", subcategories: [] },
    { name: "Investimentos", color: "#8b5cf6", icon: "trending-up", subcategories: ["Dividendos", "Juros", "Rendimentos"] },
    { name: "Outros", color: "#6b7280", icon: "more-horizontal", subcategories: ["Presentes", "Reembolsos", "Diversos"] },
  ],
}

export async function POST() {
  try {
    const userId = await getUserId()

    // Verificar se o usuário já tem categorias
    const existingCategories = await prisma.category.findMany({
      where: { userId },
    })

    if (existingCategories.length > 0) {
      return NextResponse.json(
        { error: "Usuário já possui categorias cadastradas" },
        { status: 400 }
      )
    }

    // Criar categorias de despesa
    for (const cat of defaultCategories.EXPENSE) {
      const parent = await prisma.category.create({
        data: {
          userId,
          name: cat.name,
          type: "EXPENSE",
          color: cat.color,
          icon: cat.icon,
        },
      })

      // Criar subcategorias
      for (const subName of cat.subcategories) {
        await prisma.category.create({
          data: {
            userId,
            name: subName,
            type: "EXPENSE",
            color: cat.color,
            icon: cat.icon,
            parentId: parent.id,
          },
        })
      }
    }

    // Criar categorias de receita
    for (const cat of defaultCategories.INCOME) {
      const parent = await prisma.category.create({
        data: {
          userId,
          name: cat.name,
          type: "INCOME",
          color: cat.color,
          icon: cat.icon,
        },
      })

      // Criar subcategorias
      for (const subName of cat.subcategories) {
        await prisma.category.create({
          data: {
            userId,
            name: subName,
            type: "INCOME",
            color: cat.color,
            icon: cat.icon,
            parentId: parent.id,
          },
        })
      }
    }

    return NextResponse.json({ message: "Categorias padrão criadas com sucesso" })
  } catch (error) {
    console.error("Erro ao criar categorias padrão:", error)
    return NextResponse.json(
      { error: "Erro ao criar categorias padrão" },
      { status: 500 }
    )
  }
}
