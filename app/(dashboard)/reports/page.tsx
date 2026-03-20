'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Overview {
  income: number
  expense: number
  balance: number
  transactionCount: number
  incomeCount: number
  expenseCount: number
  prevIncome: number
  prevExpense: number
  incomeChange: number
  expenseChange: number
}

interface CategoryData {
  id: string
  name: string
  color: string
  total: number
  count: number
  percentage: number
  [key: string]: string | number
}

interface MonthlyData {
  month: string
  income: number
  expense: number
  balance: number
}

interface TopExpense {
  id: string
  description: string
  amount: number
  date: string
  category?: { name: string; color: string }
  account: { name: string }
}

export default function ReportsPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const [overview, setOverview] = useState<Overview | null>(null)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [topExpenses, setTopExpenses] = useState<TopExpense[]>([])
  const [loading, setLoading] = useState(true)

  const monthParam = format(currentMonth, 'yyyy-MM')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [ov, cat, monthly, top] = await Promise.all([
      fetch(`/api/reports?type=overview&month=${monthParam}`).then((r) => r.json()),
      fetch(`/api/reports?type=categories&month=${monthParam}`).then((r) => r.json()),
      fetch(`/api/reports?type=monthly&month=${monthParam}&months=6`).then((r) => r.json()),
      fetch(`/api/reports?type=top-expenses&month=${monthParam}`).then((r) => r.json()),
    ])
    setOverview(ov)
    setCategories(cat.categories || [])
    setMonthlyData(monthly)
    setTopExpenses(top)
    setLoading(false)
  }, [monthParam])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const exportCSV = () => {
    if (!topExpenses.length) return
    const headers = ['Data', 'Descrição', 'Categoria', 'Conta', 'Valor']
    const rows = topExpenses.map((t) => [
      formatDate(new Date(t.date)),
      t.description,
      t.category?.name || 'Sem categoria',
      t.account.name,
      t.amount.toFixed(2),
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${monthParam}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ChangeIndicator = ({ value }: { value: number }) => (
    <span className={`flex items-center text-xs ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}% vs mês anterior
    </span>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500">Análise detalhada das suas finanças</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button variant="outline" onClick={exportCSV}>
            <FileText className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Receitas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(overview?.income || 0)}
                    </p>
                    <p className="text-xs text-gray-400">{overview?.incomeCount} transações</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                {overview && <ChangeIndicator value={overview.incomeChange} />}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Despesas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(overview?.expense || 0)}
                    </p>
                    <p className="text-xs text-gray-400">{overview?.expenseCount} transações</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                {overview && <ChangeIndicator value={-overview.expenseChange} />}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Saldo do Mês</p>
                    <p
                      className={`text-2xl font-bold ${
                        (overview?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(overview?.balance || 0)}
                    </p>
                    <p className="text-xs text-gray-400">{overview?.transactionCount} transações</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Evolution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolução dos Últimos 6 Meses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="income" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense by Category Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <div className="flex items-center justify-center h-[250px] text-gray-400">
                    Sem dados para este mês
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categories.map((cat, i) => (
                          <Cell key={i} fill={cat.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown Table */}
          {categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ranking de Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm font-medium">{cat.name}</span>
                          <span className="text-xs text-gray-400">({cat.count} transações)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{formatCurrency(cat.total)}</span>
                          <span className="text-xs text-gray-400 ml-2">{cat.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Expenses */}
          {topExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Maiores Despesas do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topExpenses.map((t, i) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{t.description}</p>
                          <p className="text-xs text-gray-400">
                            {t.category?.name || 'Sem categoria'} · {t.account.name} ·{' '}
                            {formatDate(new Date(t.date))}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-red-600">{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
