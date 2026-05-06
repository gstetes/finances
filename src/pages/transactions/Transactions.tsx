import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table } from '@/components/ui/Table'
import { Spinner } from '@/components/ui/Spinner'
import { TransactionForm } from './TransactionForm'
import { formatCurrency, formatDate } from '@/lib/utils'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
type TypeFilter = 'all' | 'income' | 'expense'
type MainTab = 'transactions' | 'upcoming'

const FREQUENCY_LABEL: Record<number, string> = {
  7: 'Semanal',
  14: 'Quinzenal',
  30: 'Mensal',
}

export function Transactions() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [createOpen, setCreateOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [mainTab, setMainTab] = useState<MainTab>('transactions')

  const { transactions, loading, refetch, remove, totalIncome, totalExpense, balance } = useTransactions({ month, year })
  const { recurring, loading: loadingRecurring, remove: removeRecurring, refetch: refetchRecurring } = useRecurringTransactions()
  const { toast } = useToast()

  const filtered = typeFilter === 'all' ? transactions : transactions.filter((t) => t.type === typeFilter)

  const handleRemove = async (id: string) => {
    if (!confirm('Excluir esta transação?')) return
    const { error } = await remove(id)
    if (error) toast(error.message, 'error')
    else toast('Transação excluída.', 'info')
  }

  const handleRemoveRecurring = async (id: string) => {
    if (!confirm('Excluir este lançamento recorrente? As transações já geradas não serão afetadas.')) return
    const { error } = await removeRecurring(id)
    if (error) toast(error.message, 'error')
    else toast('Lançamento recorrente excluído.', 'info')
  }

  const handleSuccess = (msg: string) => {
    toast(msg, 'success')
    setCreateOpen(false)
    refetch()
    refetchRecurring()
  }

  const today = now.toISOString().split('T')[0]

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
        <div className="flex items-center gap-2">
          {mainTab === 'transactions' && (
            <>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
          <Button onClick={() => setCreateOpen(true)}>+ Nova transação</Button>
        </div>
      </div>

      {/* Main tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setMainTab('transactions')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            mainTab === 'transactions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Lançamentos
        </button>
        <button
          onClick={() => setMainTab('upcoming')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            mainTab === 'upcoming'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Futuros
          {recurring.length > 0 && (
            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">
              {recurring.length}
            </span>
          )}
        </button>
      </div>

      {mainTab === 'transactions' && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
              <p className="text-xs text-green-600">Entradas previstas</p>
              <p className="font-bold text-green-700">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-xs text-red-600">Saídas previstas</p>
              <p className="font-bold text-red-700">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <p className="text-xs text-indigo-600">Saldo projetado</p>
              <p className={`font-bold ${balance >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>{formatCurrency(balance)}</p>
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            {([['all', 'Todas'], ['income', 'Entradas'], ['expense', 'Saídas']] as [TypeFilter, string][]).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTypeFilter(v)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  typeFilter === v ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Th>Compra</Table.Th>
                  <Table.Th>Pagamento</Table.Th>
                  <Table.Th>Descrição</Table.Th>
                  <Table.Th>Categoria</Table.Th>
                  <Table.Th>Conta / Cartão</Table.Th>
                  <Table.Th className="text-right">Valor</Table.Th>
                  <Table.Th />
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {filtered.length === 0 ? (
                  <Table.Empty colSpan={7} message="Nenhuma transação no período." />
                ) : (
                  filtered.map((t) => (
                    <Table.Row key={t.id}>
                      <Table.Td className="whitespace-nowrap text-xs text-gray-500">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </Table.Td>
                      <Table.Td className="whitespace-nowrap text-xs">
                        {t.payment_date && t.payment_date !== t.date ? (
                          <span className="font-medium text-amber-600">
                            {new Date(t.payment_date).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            {new Date(t.payment_date ?? t.date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <span className="font-medium text-gray-800">{t.description ?? '—'}</span>
                        {t.is_recurring && <Badge variant="info" className="ml-2 text-xs">Recorrente</Badge>}
                      </Table.Td>
                      <Table.Td>
                        {t.category ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.category.color }} />
                            <span className="text-sm">{t.category.name}</span>
                          </div>
                        ) : '—'}
                      </Table.Td>
                      <Table.Td className="text-sm text-gray-500">
                        {t.account?.name ?? t.invoice?.credit_card?.name ?? '—'}
                      </Table.Td>
                      <Table.Td className="text-right font-semibold">
                        <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </Table.Td>
                      <Table.Td>
                        <button onClick={() => handleRemove(t.id)} className="text-gray-400 hover:text-red-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </Table.Td>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>
          )}
        </>
      )}

      {mainTab === 'upcoming' && (
        <>
          <p className="mb-4 text-sm text-gray-500">
            Lançamentos recorrentes ativos. O job processa automaticamente à meia-noite e cria as transações quando chegam na data.
          </p>

          {loadingRecurring ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Th>Próximo lançamento</Table.Th>
                  <Table.Th>Descrição</Table.Th>
                  <Table.Th>Categoria</Table.Th>
                  <Table.Th>Conta / Cartão</Table.Th>
                  <Table.Th>Frequência</Table.Th>
                  <Table.Th className="text-right">Valor</Table.Th>
                  <Table.Th />
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {recurring.length === 0 ? (
                  <Table.Empty colSpan={7} message="Nenhum lançamento recorrente ativo." />
                ) : (
                  recurring.map((r) => {
                    const isOverdue = r.next_due_date < today
                    return (
                      <Table.Row key={r.id}>
                        <Table.Td className="whitespace-nowrap text-xs">
                          <span className={isOverdue ? 'font-semibold text-orange-600' : 'text-gray-500'}>
                            {formatDate(r.next_due_date)}
                          </span>
                          {isOverdue && (
                            <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                              pendente
                            </span>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <span className="font-medium text-gray-800">{r.description ?? '—'}</span>
                        </Table.Td>
                        <Table.Td>
                          {r.category ? (
                            <div className="flex items-center gap-1.5">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.category.color }} />
                              <span className="text-sm">{r.category.name}</span>
                            </div>
                          ) : '—'}
                        </Table.Td>
                        <Table.Td className="text-sm text-gray-500">
                          {r.account?.name ?? r.credit_card?.name ?? '—'}
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="info" className="text-xs">
                            {FREQUENCY_LABEL[r.frequency_days] ?? `${r.frequency_days}d`}
                          </Badge>
                        </Table.Td>
                        <Table.Td className="text-right font-semibold">
                          <span className={r.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
                          </span>
                        </Table.Td>
                        <Table.Td>
                          <button onClick={() => handleRemoveRecurring(r.id)} className="text-gray-400 hover:text-red-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </Table.Td>
                      </Table.Row>
                    )
                  })
                )}
              </Table.Body>
            </Table>
          )}
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova transação" size="md">
        <TransactionForm onSuccess={handleSuccess} onCancel={() => setCreateOpen(false)} onError={(msg) => toast(msg, 'error')} />
      </Modal>
    </div>
  )
}
