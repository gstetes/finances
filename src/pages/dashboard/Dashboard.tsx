import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  color?: 'indigo' | 'green' | 'red' | 'blue'
}

const colorMap: Record<NonNullable<StatCardProps['color']>, string> = {
  indigo: 'bg-indigo-50 text-indigo-700',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-blue-50 text-blue-700',
}

function StatCard({ label, value, sub, color = 'indigo' }: StatCardProps) {
  return (
    <Card>
      <Card.Body className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </Card.Body>
    </Card>
  )
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface CategoryStat {
  name: string
  color: string
  value: number
}

interface DailyStat {
  day: string
  income: number
  expense: number
}

export function Dashboard() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { transactions, loading, totalIncome, totalExpense } = useTransactions({ month, year })
  const { accounts } = useAccounts()
  const { user } = useAuth()

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0)

  const expenseByCategory = useMemo<CategoryStat[]>(() => {
    const map: Record<string, CategoryStat> = {}
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
      const name = t.category?.name ?? 'Outros'
      const color = t.category?.color ?? '#78716c'
      map[name] = { name, color, value: (map[name]?.value ?? 0) + Number(t.amount) }
    })
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [transactions])

  const dailyData = useMemo<DailyStat[]>(() => {
    const map: Record<string, DailyStat> = {}
    transactions.forEach((t) => {
      const d = t.date.slice(8, 10)
      if (!map[d]) map[d] = { day: `${d}/${String(month).padStart(2, '0')}`, income: 0, expense: 0 }
      if (t.type === 'income') map[d].income += Number(t.amount)
      else map[d].expense += Number(t.amount)
    })
    return Object.values(map).sort((a, b) => a.day.localeCompare(b.day))
  }, [transactions, month])

  const savingsForecast = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? ((savingsForecast / totalIncome) * 100).toFixed(1) : '0'
  const recentTransactions = transactions.slice(0, 5)
  const yearOptions = [year - 1, year, year + 1]

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {(user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'você'} 👋
          </h1>
          <p className="text-sm text-gray-500">Aqui está o resumo das suas finanças</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Saldo total" value={formatCurrency(totalBalance)} color="blue" />
            <StatCard label="Entradas" value={formatCurrency(totalIncome)} color="green" sub={`${MONTHS[month - 1]}/${year}`} />
            <StatCard label="Saídas" value={formatCurrency(totalExpense)} color="red" sub={`${MONTHS[month - 1]}/${year}`} />
            <StatCard label="Previsão de sobra" value={formatCurrency(savingsForecast)} color="indigo" sub={`Taxa de poupança: ${savingsRate}%`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <Card.Header><h2 className="text-sm font-semibold text-gray-700">Gastos por categoria</h2></Card.Header>
              <Card.Body>
                {expenseByCategory.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">Sem gastos no período</p>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={200}>
                      <PieChart>
                        <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                          {expenseByCategory.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {expenseByCategory.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="max-w-20 truncate text-gray-600">{cat.name}</span>
                          </div>
                          <span className="font-medium text-gray-800">{formatCurrency(cat.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header><h2 className="text-sm font-semibold text-gray-700">Entradas vs Saídas (diário)</h2></Card.Header>
              <Card.Body>
                {dailyData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">Sem transações no período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dailyData} barSize={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="income" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card.Body>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <Card.Header><h2 className="text-sm font-semibold text-gray-700">Suas contas</h2></Card.Header>
              <Card.Body className="space-y-3">
                {accounts.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma conta cadastrada</p>
                ) : (
                  accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: account.color }} />
                        <span className="text-sm text-gray-700">{account.name}</span>
                        <Badge variant="default" className="text-xs capitalize">{account.type}</Badge>
                      </div>
                      <span className={`text-sm font-semibold ${Number(account.balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header><h2 className="text-sm font-semibold text-gray-700">Transações recentes</h2></Card.Header>
              <Card.Body className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma transação no período</p>
                ) : (
                  recentTransactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-white"
                          style={{ backgroundColor: t.category?.color ?? '#6366f1' }}
                        >
                          {(t.category?.name ?? 'O')[0]}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-gray-800">{t.description ?? t.category?.name ?? '—'}</p>
                          <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
