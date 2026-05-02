import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccounts } from '@/hooks/useAccounts'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency } from '@/lib/utils'
import type { Account, AccountType } from '@/types/database'

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Conta Corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'investment', label: 'Investimento' },
  { value: 'other', label: 'Outro' },
]

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  type: z.enum(['checking', 'savings', 'cash', 'investment', 'other']),
  balance: z.string().optional().transform((v) => (v === '' || v === undefined ? 0 : parseFloat(v))),
  color: z.string(),
})

type FormInput = z.input<typeof schema>
type FormData = z.output<typeof schema>

interface AccountFormProps {
  onSubmit: (data: FormData) => void
  defaultValues?: Partial<Account>
  loading?: boolean
}

function AccountForm({ onSubmit, defaultValues, loading }: AccountFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { color: defaultValues?.color ?? '#6366f1', name: defaultValues?.name, type: defaultValues?.type, balance: defaultValues?.balance?.toString() },
  })
  const color = watch('color') ?? '#6366f1'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome da conta" error={errors.name?.message} required {...register('name')} />
      <Select label="Tipo" error={errors.type?.message} required placeholder="Selecione..." {...register('type')}>
        {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </Select>
      <Input label="Saldo inicial" type="number" step="0.01" error={errors.balance?.message} {...register('balance')} />
      <ColorPicker label="Cor" value={color} onChange={(c) => setValue('color', c)} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  )
}

export function Accounts() {
  const { accounts, loading, create, update, remove } = useAccounts()
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Account | null>(null)
  const [saving, setSaving] = useState(false)

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0)

  const handleCreate = async (data: FormData) => {
    setSaving(true)
    const { error } = await create(data)
    setSaving(false)
    if (error) return toast(error.message, 'error')
    toast('Conta criada!', 'success')
    setCreateOpen(false)
  }

  const handleEdit = async (data: FormData) => {
    if (!editTarget) return
    setSaving(true)
    const { error } = await update(editTarget.id, data)
    setSaving(false)
    if (error) return toast(error.message, 'error')
    toast('Conta atualizada!', 'success')
    setEditTarget(null)
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Arquivar esta conta?')) return
    const { error } = await remove(id)
    if (error) toast(error.message, 'error')
    else toast('Conta arquivada.', 'info')
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas</h1>
          <p className="text-sm text-gray-500">Saldo total: {formatCurrency(totalBalance)}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Nova conta</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : accounts.length === 0 ? (
        <Card>
          <Card.Body className="py-16 text-center">
            <p className="text-gray-400">Nenhuma conta cadastrada.</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>Criar primeira conta</Button>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <Card.Body>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: account.color }}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{account.name}</p>
                      <Badge variant="default">{ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditTarget(account)} className="p-1 text-gray-400 hover:text-gray-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => handleRemove(account.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-gray-500">Saldo atual</p>
                  <p className={`text-2xl font-bold ${Number(account.balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova conta">
        <AccountForm onSubmit={handleCreate} loading={saving} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar conta">
        {editTarget && <AccountForm onSubmit={handleEdit} defaultValues={editTarget} loading={saving} />}
      </Modal>
    </div>
  )
}
