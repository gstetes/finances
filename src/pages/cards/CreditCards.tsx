import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreditCards } from '@/hooks/useCreditCards'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency } from '@/lib/utils'
import type { CreditCard } from '@/types/database'

const BRANDS = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard', 'Outro'] as const

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  brand: z.string().nullable().transform((v) => v ?? null),
  closing_day: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(1).max(31, 'Dia inválido')),
  due_day: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(1).max(31, 'Dia inválido')),
  limit_amount: z.number().min(0),
  color: z.string(),
})

type FormInput = z.input<typeof schema>
type FormData = z.output<typeof schema>

interface CardFormProps {
  onSubmit: (data: FormData) => void
  defaultValues?: Partial<CreditCard>
  loading?: boolean
}

function CardForm({ onSubmit, defaultValues, loading }: CardFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      color: defaultValues?.color ?? '#6366f1',
      limit_amount: defaultValues?.limit_amount ?? 0,
      name: defaultValues?.name,
      brand: defaultValues?.brand ?? undefined,
      closing_day: defaultValues?.closing_day?.toString(),
      due_day: defaultValues?.due_day?.toString(),
    },
  })
  const color = watch('color') ?? '#6366f1'
  const limitAmount = watch('limit_amount') ?? 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome do cartão" error={errors.name?.message} required {...register('name')} />
      <Select label="Bandeira" {...register('brand')}>
        {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
      </Select>
      <CurrencyInput
        label="Limite"
        value={limitAmount}
        onChange={(v) => setValue('limit_amount', v)}
        error={errors.limit_amount?.message}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Dia de fechamento" type="number" min={1} max={31} error={errors.closing_day?.message} required {...register('closing_day')} />
        <Input label="Dia de vencimento" type="number" min={1} max={31} error={errors.due_day?.message} required {...register('due_day')} />
      </div>
      <ColorPicker label="Cor" value={color} onChange={(c) => setValue('color', c)} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  )
}

export function CreditCards() {
  const { cards, loading, create, update, remove } = useCreditCards()
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CreditCard | null>(null)
  const [saving, setSaving] = useState(false)

  const handleCreate = async (data: FormData) => {
    setSaving(true)
    const { error } = await create(data)
    setSaving(false)
    if (error) return toast(error.message, 'error')
    toast('Cartão criado!', 'success')
    setCreateOpen(false)
  }

  const handleEdit = async (data: FormData) => {
    if (!editTarget) return
    setSaving(true)
    const { error } = await update(editTarget.id, data)
    setSaving(false)
    if (error) return toast(error.message, 'error')
    toast('Cartão atualizado!', 'success')
    setEditTarget(null)
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Arquivar este cartão?')) return
    const { error } = await remove(id)
    if (error) toast(error.message, 'error')
    else toast('Cartão arquivado.', 'info')
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cartões de crédito</h1>
          <p className="text-sm text-gray-500">{cards.length} cartão{cards.length !== 1 ? 'ões' : ''} cadastrado{cards.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Novo cartão</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : cards.length === 0 ? (
        <Card>
          <Card.Body className="py-16 text-center">
            <p className="text-gray-400">Nenhum cartão cadastrado.</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>Adicionar cartão</Button>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}99)` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs opacity-75">Limite</p>
                  <p className="text-xl font-bold">{formatCurrency(card.limit_amount)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditTarget(card)} className="rounded p-1 hover:bg-white/20">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => handleRemove(card.id)} className="rounded p-1 hover:bg-white/20">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-lg font-semibold">{card.name}</p>
                {card.brand && <p className="text-sm opacity-75">{card.brand}</p>}
              </div>
              <div className="mt-4 flex gap-4 text-xs opacity-80">
                <span>Fecha dia {card.closing_day}</span>
                <span>Vence dia {card.due_day}</span>
              </div>
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute -right-2 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo cartão de crédito">
        <CardForm onSubmit={handleCreate} loading={saving} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar cartão">
        {editTarget && <CardForm onSubmit={handleEdit} defaultValues={editTarget} loading={saving} />}
      </Modal>
    </div>
  )
}
