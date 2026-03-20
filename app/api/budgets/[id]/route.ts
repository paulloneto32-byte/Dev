import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  amount: z.number().positive().optional(),
  rollover: z.boolean().optional(),
})

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()

  const { id } = await params
  const existing = await prisma.budget.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const data = updateSchema.parse(body)

  const budget = await prisma.budget.update({ where: { id }, data, include: { category: true } })
  return NextResponse.json(budget)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()

  const { id } = await params
  const existing = await prisma.budget.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.budget.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
