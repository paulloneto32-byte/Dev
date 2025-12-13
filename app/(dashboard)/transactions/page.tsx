"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, ArrowUpCircle, ArrowDownCircle, Edit, Trash2, Filter } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Transaction {
  id: string
  amount: number
  date: string
  description: string
  type: string
  account: { id: string; name: string }
  category?: { id: string; name: string; color: string }
  installments?: number
  currentInstallment?: number
}

interface Account {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  type: string
  color: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7),
    accountId: "",
    categoryId: "",
    type: "",
  })

  const [formData, setFormData] = useState({
    accountId: "",
    categoryId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    type: "EXPENSE",
    installments: "1",
  })

  useEffect(() => {
    loadAccounts()
    loadCategories()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [filters])

  const loadTransactions = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.month) params.append("month", filters.month)
      if (filters.accountId) params.append("accountId", filters.accountId)
      if (filters.categoryId) params.append("categoryId", filters.categoryId)
      if (filters.type) params.append("type", filters.type)

      const response = await fetch(`/api/transactions?${params}`)
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error("Erro ao carregar transações:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAccounts = async () => {
    try {
      const response = await fetch("/api/accounts")
      const data = await response.json()
      setAccounts(data)
    } catch (error) {
      console.error("Erro ao carregar contas:", error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingTransaction
        ? `/api/transactions/${editingTransaction.id}`
        : "/api/transactions"

      const method = editingTransaction ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          categoryId: formData.categoryId || null,
          installments: parseInt(formData.installments),
        }),
      })

      if (response.ok) {
        await loadTransactions()
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Erro ao salvar transação:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadTransactions()
      }
    } catch (error) {
      console.error("Erro ao excluir transação:", error)
    }
  }

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      accountId: transaction.account.id,
      categoryId: transaction.category?.id || "",
      amount: transaction.amount.toString(),
      date: new Date(transaction.date).toISOString().slice(0, 10),
      description: transaction.description,
      type: transaction.type,
      installments: "1",
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingTransaction(null)
    setFormData({
      accountId: "",
      categoryId: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      description: "",
      type: "EXPENSE",
      installments: "1",
    })
  }

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  const filteredCategories = categories.filter(
    (cat) => !cat.type || cat.type === formData.type
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Transações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Registre suas receitas e despesas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? "Editar Transação" : "Nova Transação"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da transação
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value, categoryId: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXPENSE">Despesa</SelectItem>
                      <SelectItem value="INCOME">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="accountId">Conta</Label>
                  <Select
                    value={formData.accountId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, accountId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="categoryId">Categoria (opcional)</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem categoria</SelectItem>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Ex: Compras no supermercado"
                    required
                  />
                </div>
                {!editingTransaction && (
                  <div>
                    <Label htmlFor="installments">Parcelas</Label>
                    <Input
                      id="installments"
                      type="number"
                      min="1"
                      max="60"
                      value={formData.installments}
                      onChange={(e) =>
                        setFormData({ ...formData, installments: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deixe 1 para transação única
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="filterMonth">Mês</Label>
              <Input
                id="filterMonth"
                type="month"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="filterAccount">Conta</Label>
              <Select
                value={filters.accountId}
                onValueChange={(value) =>
                  setFilters({ ...filters, accountId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterCategory">Categoria</Label>
              <Select
                value={filters.categoryId}
                onValueChange={(value) =>
                  setFilters({ ...filters, categoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterType">Tipo</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="INCOME">Receitas</SelectItem>
                  <SelectItem value="EXPENSE">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpense)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando transações...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === "INCOME"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.type === "INCOME" ? (
                        <ArrowUpCircle className="h-5 w-5" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.currentInstallment && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {transaction.currentInstallment}/{transaction.installments}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(transaction.date)}</span>
                        <span>•</span>
                        <span>{transaction.account.name}</span>
                        {transaction.category && (
                          <>
                            <span>•</span>
                            <span
                              className="px-2 py-0.5 rounded text-xs"
                              style={{
                                backgroundColor: transaction.category.color + "20",
                                color: transaction.category.color,
                              }}
                            >
                              {transaction.category.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${
                          transaction.type === "INCOME"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(transaction)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
