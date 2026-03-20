import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const cardSchema = z.object({
  name: z.string().min(1),
  lastDigits: z.string().length(4),
  brand: z.string().min(1),
  limit: z.number().positive(),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  color: z.string().default('#f59e0b'),
})

export async function GET() {
  const userId = await getUserId()

  const cards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(cards)
}

export async function POST(request: Request) {
  const userId = await getUserId()

  const body = await request.json()
  const data = cardSchema.parse(body)

  const card = await prisma.creditCard.create({
    data: { ...data, userId },
  })

  return NextResponse.json(card, { status: 201 })
}
