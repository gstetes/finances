import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table } from '@/components/ui/Table'
import { Spinner } from '@/components/ui/Spinner'
import { TransactionForm } from './TransactionForm'
import { formatCurrency } from '@/lib/utils'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
type TypeFilter = 'all' | 'income' | 'expense'

export function Transactions() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [createOpen, setCreateOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const { transactions, loading, refetch, remove, totalIncome, totalExpense, balance } = useTransactions({ month, year })
  const { toast } = useToast()

  const filtered = typeFilter === 'all' ? transactions : transactions.filter((t) => t.type === typeFilter)

  const handleRemove = async (id: string) => {
    if (!confirm('Excluir esta transação?')) return
    const { error } = await remove(id)
    if (error) toast(error.message, 'error')
    else toast('Transação excluída.', 'info')
  }

  const handleSuccess = (msg: string) => {
    toast(msg, 'success')
    setCreateOpen(false)
    refetch()
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button onClick={() => setCreateOpen(true)}>+ Nova transação</Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
          <p className="text-xs text-green-600">Entradas</p>
          <p className="font-bold text-green-700">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-600">Saídas</p>
          <p className="font-bold text-red-700">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-xs text-indigo-600">Saldo do período</p>
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
              <Table.Th>Data</Table.Th>
              <Table.Th>Descrição</Table.Th>
              <Table.Th>Categoria</Table.Th>
              <Table.Th>Conta / Cartão</Table.Th>
              <Table.Th className="text-right">Valor</Table.Th>
              <Table.Th />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {filtered.length === 0 ? (
              <Table.Empty colSpan={6} message="Nenhuma transação no período." />
            ) : (
              filtered.map((t) => (
                <Table.Row key={t.id}>
                  <Table.Td className="whitespace-nowrap text-xs text-gray-500">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova transação" size="md">
        <TransactionForm onSuccess={handleSuccess} onCancel={() => setCreateOpen(false)} onError={(msg) => toast(msg, 'error')} />
      </Modal>
    </div>
  )
}
