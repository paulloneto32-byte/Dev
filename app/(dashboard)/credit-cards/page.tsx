'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { Plus, CreditCard, Trash2, Edit2, Calendar, DollarSign } from 'lucide-react'

const CARD_BRANDS = ['Visa', 'Mastercard', 'American Express', 'Elo', 'Hipercard', 'Outro']
const CARD_COLORS = [
  '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#1f2937',
]

interface CreditCardData {
  id: string
  name: string
  lastDigits: string
  brand: string
  limit: number
  closingDay: number
  dueDay: number
  color: string
  isActive: boolean
}

const defaultForm = {
  name: '',
  lastDigits: '',
  brand: 'Visa',
  limit: '',
  closingDay: '1',
  dueDay: '10',
  color: '#f59e0b',
}

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardData | null>(null)
  const [form, setForm] = useState(defaultForm)

  const fetchCards = async () => {
    setLoading(true)
    const res = await fetch('/api/credit-cards')
    if (res.ok) setCards(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchCards() }, [])

  const openEdit = (card: CreditCardData) => {
    setEditingCard(card)
    setForm({
      name: card.name,
      lastDigits: card.lastDigits,
      brand: card.brand,
      limit: card.limit.toString(),
      closingDay: card.closingDay.toString(),
      dueDay: card.dueDay.toString(),
      color: card.color,
    })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingCard(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      lastDigits: form.lastDigits,
      brand: form.brand,
      limit: parseFloat(form.limit),
      closingDay: parseInt(form.closingDay),
      dueDay: parseInt(form.dueDay),
      color: form.color,
    }

    const res = editingCard
      ? await fetch(`/api/credit-cards/${editingCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/credit-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

    if (res.ok) {
      setDialogOpen(false)
      fetchCards()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cartão?')) return
    const res = await fetch(`/api/credit-cards/${id}`, { method: 'DELETE' })
    if (res.ok) fetchCards()
  }

  const toggleActive = async (card: CreditCardData) => {
    await fetch(`/api/credit-cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !card.isActive }),
    })
    fetchCards()
  }

  // Calculate invoice period for a card
  const getInvoicePeriod = (card: CreditCardData) => {
    const now = new Date()
    const day = now.getDate()
    const closing = card.closingDay
    const due = card.dueDay

    let invoiceMonth = now.getMonth()
    let invoiceYear = now.getFullYear()

    if (day > closing) {
      // Current invoice already closed, show next
      invoiceMonth++
      if (invoiceMonth > 11) { invoiceMonth = 0; invoiceYear++ }
    }

    const dueDate = new Date(invoiceYear, invoiceMonth, due)
    const closingDate = new Date(invoiceYear, invoiceMonth - 1 < 0 ? 11 : invoiceMonth - 1, closing)

    return {
      dueDate: dueDate.toLocaleDateString('pt-BR'),
      closingDate: closingDate.toLocaleDateString('pt-BR'),
    }
  }

  const getBrandIcon = (brand: string) => {
    const icons: Record<string, string> = {
      Visa: '💳',
      Mastercard: '💳',
      'American Express': '💳',
      Elo: '💳',
      Hipercard: '💳',
      Outro: '💳',
    }
    return icons[brand] || '💳'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cartões de Crédito</h1>
          <p className="text-gray-500">Gerencie seus cartões e faturas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCard ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome do cartão</Label>
                  <Input
                    placeholder="Ex: Nubank Roxinho"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Últimos 4 dígitos</Label>
                  <Input
                    placeholder="1234"
                    maxLength={4}
                    value={form.lastDigits}
                    onChange={(e) => setForm({ ...form, lastDigits: e.target.value.replace(/\D/g, '') })}
                    required
                  />
                </div>
                <div>
                  <Label>Bandeira</Label>
                  <Select value={form.brand} onValueChange={(v) => setForm({ ...form, brand: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_BRANDS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Limite (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.limit}
                    onChange={(e) => setForm({ ...form, limit: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Dia de fechamento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={form.closingDay}
                    onChange={(e) => setForm({ ...form, closingDay: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Dia de vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={form.dueDay}
                    onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {CARD_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm({ ...form, color })}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          form.color === color ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingCard ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : cards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">Nenhum cartão cadastrado</p>
            <p className="text-sm text-gray-400">Adicione seus cartões de crédito para controlar seus gastos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const { dueDate, closingDate } = getInvoicePeriod(card)
            return (
              <div key={card.id} className="space-y-3">
                {/* Card visual */}
                <div
                  className="relative rounded-2xl p-6 text-white shadow-lg"
                  style={{ backgroundColor: card.color, minHeight: 180 }}
                >
                  {!card.isActive && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <span className="text-white font-medium">Inativo</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-white/80 text-xs">{card.brand}</p>
                      <p className="font-bold text-lg">{card.name}</p>
                    </div>
                    <span className="text-2xl">{getBrandIcon(card.brand)}</span>
                  </div>
                  <p className="text-white/70 tracking-widest text-sm">
                    •••• •••• •••• {card.lastDigits}
                  </p>
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <p className="text-white/70 text-xs">Limite</p>
                      <p className="font-bold">{formatCurrency(card.limit)}</p>
                    </div>
                  </div>
                </div>

                {/* Card info */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Fecha: dia {card.closingDay}</span>
                      <span className="text-gray-300">·</span>
                      <span>Vence: dia {card.dueDay}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <span>Próx. fatura fecha em {closingDate}</span>
                        <br />
                        <span className="text-gray-400">Vencimento: {dueDate}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEdit(card)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(card)}
                        className={card.isActive ? 'text-yellow-600' : 'text-green-600'}
                      >
                        {card.isActive ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(card.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
