'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: string
}

interface Budget {
  id: string
  categoryId: string
  amount: number
  spent: number
  rollover: boolean
  category: Category
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    categoryId: '',
    amount: '',
    rollover: false,
  })

  const monthParam = format(currentMonth, 'yyyy-MM')

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/budgets?month=${monthParam}`)
    if (res.ok) setBudgets(await res.json())
    setLoading(false)
  }, [monthParam])

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    if (res.ok) {
      const data = await res.json()
      setCategories(data.filter((c: Category) => c.type === 'EXPENSE'))
    }
  }

  useEffect(() => {
    fetchBudgets()
    fetchCategories()
  }, [fetchBudgets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: form.categoryId,
        month: monthParam,
        amount: parseFloat(form.amount),
        rollover: form.rollover,
      }),
    })
    if (res.ok) {
      setDialogOpen(false)
      setForm({ categoryId: '', amount: '', rollover: false })
      fetchBudgets()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este orçamento?')) return
    const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' })
    if (res.ok) fetchBudgets()
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent

  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId))
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id))

  const getStatusColor = (spent: number, amount: number) => {
    const pct = (spent / amount) * 100
    if (pct >= 100) return 'bg-red-500'
    if (pct >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusIcon = (spent: number, amount: number) => {
    const pct = (spent / amount) * 100
    if (pct >= 100) return <AlertTriangle className="w-4 h-4 text-red-500" />
    if (pct >= 80) return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500">Controle seus gastos por categoria</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month navigation */}
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Orçamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => setForm({ ...form, categoryId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor limite (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rollover"
                    checked={form.rollover}
                    onChange={(e) => setForm({ ...form, rollover: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="rollover">Acumular saldo não utilizado</Label>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Salvar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Orçado</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Gasto</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totalRemaining >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <CheckCircle className={`w-5 h-5 ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Disponível</p>
                <p className={`text-xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall progress */}
      {budgets.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso Geral</span>
              <span className="text-sm text-gray-500">
                {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
              </span>
            </div>
            <Progress
              value={totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}
              className="h-3"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>Gasto: {formatCurrency(totalSpent)}</span>
              <span>Limite: {formatCurrency(totalBudget)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">Nenhum orçamento para este mês</p>
            <p className="text-sm text-gray-400">
              Crie orçamentos por categoria para controlar seus gastos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const pct = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0
            const remaining = budget.amount - budget.spent

            return (
              <Card key={budget.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: budget.category.color }}
                      />
                      <CardTitle className="text-base">{budget.category.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(budget.spent, budget.amount)}
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Gasto: <span className="font-medium text-gray-900">{formatCurrency(budget.spent)}</span>
                      </span>
                      <span className="text-gray-500">
                        Limite: <span className="font-medium text-gray-900">{formatCurrency(budget.amount)}</span>
                      </span>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getStatusColor(budget.spent, budget.amount)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {remaining >= 0 ? `Restam ${formatCurrency(remaining)}` : `Excedido em ${formatCurrency(Math.abs(remaining))}`}
                      </span>
                      <span className="text-gray-400">{Math.round(pct)}%</span>
                    </div>
                    {budget.rollover && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        Acumula saldo
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
