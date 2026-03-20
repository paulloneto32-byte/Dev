import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  limit: z.number().positive().optional(),
  closingDay: z.number().min(1).max(31).optional(),
  dueDay: z.number().min(1).max(31).optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()

  const { id } = await params
  const existing = await prisma.creditCard.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const data = updateSchema.parse(body)

  const card = await prisma.creditCard.update({ where: { id }, data })
  return NextResponse.json(card)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()

  const { id } = await params
  const existing = await prisma.creditCard.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.creditCard.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
