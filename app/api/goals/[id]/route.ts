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
  const { name, targetAmount, currentAmount, deadline, accountId, color, icon, isCompleted } = body

  const goal = await prisma.goal.update({
    where: { id, userId },
    data: {
      ...(name && { name }),
      ...(targetAmount !== undefined && { targetAmount }),
      ...(currentAmount !== undefined && { currentAmount }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(accountId !== undefined && { accountId }),
      ...(color && { color }),
      ...(icon && { icon }),
      ...(isCompleted !== undefined && { isCompleted }),
    },
    include: { account: true },
  })
  return NextResponse.json(goal)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()

  const { id } = await params
  await prisma.goal.delete({ where: { id, userId } })
  return NextResponse.json({ message: "Meta excluída com sucesso" })
}
