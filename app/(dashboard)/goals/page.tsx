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
import { Progress } from "@/components/ui/progress"
import { Plus, Target, Edit, Trash2, TrendingUp, Check } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  color: string
  icon: string
  isCompleted: boolean
  account?: { id: string; name: string }
}

interface Account {
  id: string
  name: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [depositDialogOpen, setDepositDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [depositingGoal, setDepositingGoal] = useState<Goal | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    accountId: "",
    color: "#10b981",
  })

  const [depositAmount, setDepositAmount] = useState("")

  useEffect(() => {
    loadGoals()
    loadAccounts()
  }, [])

  const loadGoals = async () => {
    try {
      const response = await fetch("/api/goals")
      const data = await response.json()
      setGoals(data)
    } catch (error) {
      console.error("Erro ao carregar metas:", error)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingGoal ? `/api/goals/${editingGoal.id}` : "/api/goals"
      const method = editingGoal ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          targetAmount: parseFloat(formData.targetAmount),
        }),
      })

      if (response.ok) {
        await loadGoals()
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Erro ao salvar meta:", error)
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!depositingGoal) return

    try {
      const response = await fetch(`/api/goals/${depositingGoal.id}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
        }),
      })

      if (response.ok) {
        await loadGoals()
        setDepositDialogOpen(false)
        setDepositAmount("")
        setDepositingGoal(null)
      }
    } catch (error) {
      console.error("Erro ao depositar:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return

    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadGoals()
      }
    } catch (error) {
      console.error("Erro ao excluir meta:", error)
    }
  }

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : "",
      accountId: goal.account?.id || "",
      color: goal.color,
    })
    setDialogOpen(true)
  }

  const openDepositDialog = (goal: Goal) => {
    setDepositingGoal(goal)
    setDepositDialogOpen(true)
  }

  const resetForm = () => {
    setEditingGoal(null)
    setFormData({
      name: "",
      targetAmount: "",
      deadline: "",
      accountId: "",
      color: "#10b981",
    })
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const calculateTimeRemaining = (deadline: string | null) => {
    if (!deadline) return null

    const now = new Date()
    const target = new Date(deadline)
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Prazo expirado"
    if (diffDays === 0) return "Hoje"
    if (diffDays === 1) return "Amanhã"
    if (diffDays < 30) return `${diffDays} dias`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses`
    return `${Math.floor(diffDays / 365)} anos`
  }

  const activeGoals = goals.filter((g) => !g.isCompleted)
  const completedGoals = goals.filter((g) => g.isCompleted)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Metas de Poupança
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Defina e acompanhe suas metas financeiras
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Editar Meta" : "Nova Meta"}
              </DialogTitle>
              <DialogDescription>
                Defina uma meta de poupança
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Meta</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Viagem para Europa"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="targetAmount">Valor Objetivo</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, targetAmount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Prazo (opcional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="accountId">Conta Associada (opcional)</Label>
                  <Select
                    value={formData.accountId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, accountId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

      {/* Dialog de Depósito */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Depositar na Meta</DialogTitle>
            <DialogDescription>
              Adicione um valor à meta "{depositingGoal?.name}"
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeposit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="depositAmount">Valor do Depósito</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDepositDialogOpen(false)
                  setDepositAmount("")
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Depositar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Metas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeGoals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Metas Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedGoals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Economizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(goals.reduce((sum, g) => sum + g.currentAmount, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metas Ativas */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Metas Ativas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeGoals.map((goal) => {
              const progress = calculateProgress(goal.currentAmount, goal.targetAmount)
              const remaining = goal.targetAmount - goal.currentAmount
              const timeRemaining = calculateTimeRemaining(goal.deadline)

              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: goal.color }}
                        >
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          {goal.account && (
                            <p className="text-sm text-muted-foreground">
                              {goal.account.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(goal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-semibold">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <p className="text-muted-foreground">Atual</p>
                        <p className="font-semibold">{formatCurrency(goal.currentAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Objetivo</p>
                        <p className="font-semibold">{formatCurrency(goal.targetAmount)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Faltam</p>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(remaining)}
                        </p>
                        {timeRemaining && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {timeRemaining}
                          </p>
                        )}
                      </div>
                      <Button onClick={() => openDepositDialog(goal)}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Depositar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Metas Concluídas */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-600">Metas Concluídas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="border-green-200 bg-green-50 dark:bg-green-950">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white">
                        <Check className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        <p className="text-sm text-green-600">Concluída!</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(goal.currentAmount)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Objetivo: {formatCurrency(goal.targetAmount)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          Carregando metas...
        </div>
      )}

      {!loading && goals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma meta cadastrada. Crie sua primeira meta!
          </CardContent>
        </Card>
      )}
    </div>
  )
}
