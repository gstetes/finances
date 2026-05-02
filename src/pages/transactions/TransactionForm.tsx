import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useCreditCards } from '@/hooks/useCreditCards'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { CurrencyInput } from '@/components/ui/CurrencyInput'

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data obrigatória'),
  category_id: z.string().min(1, 'Categoria obrigatória'),
  destination: z.string().min(1, 'Conta ou cartão obrigatório'),
  is_recurring: z.boolean(),
  frequency_days: z.string().optional().transform((v) => (v === '' || v === undefined ? undefined : parseInt(v, 10))).pipe(z.number().optional()),
}).refine((d) => !d.is_recurring || d.frequency_days, {
  message: 'Selecione a frequência',
  path: ['frequency_days'],
})

type FormInput = z.input<typeof schema>
type FormData = z.output<typeof schema>

interface TransactionFormProps {
  onSuccess?: (message: string) => void
  onCancel?: () => void
  onError?: (message: string) => void
}

export function TransactionForm({ onSuccess, onCancel, onError }: TransactionFormProps) {
  const { categories } = useCategories()
  const { accounts } = useAccounts()
  const { cards } = useCreditCards()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      is_recurring: false,
      amount: 0,
    },
  })

  const type = watch('type')
  const isRecurring = watch('is_recurring')
  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both')

  const destinationOptions = [
    ...accounts.map((a) => ({ value: `account:${a.id}`, label: `💳 ${a.name}` })),
    ...cards.map((c) => ({ value: `card:${c.id}`, label: `💳 ${c.name} (crédito)` })),
  ]

  const onSubmit = async (data: FormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    const isCard = data.destination.startsWith('card:')
    const destId = data.destination.split(':')[1]

    if (data.is_recurring) {
      const { error } = await supabase.from('recurring_transactions').insert({
        user_id: user!.id,
        type: data.type,
        amount: data.amount,
        description: data.description ?? null,
        category_id: data.category_id,
        account_id: isCard ? null : destId,
        credit_card_id: isCard ? destId : null,
        frequency_days: data.frequency_days as 7 | 14 | 30,
        next_due_date: data.date,
      })
      if (error) { onError?.(error.message); return }
      onSuccess?.('Lançamento recorrente criado!')
      return
    }

    let invoice_id: string | null = null
    if (isCard) {
      const d = new Date(data.date)
      const month = d.getMonth() + 1
      const year = d.getFullYear()
      const { data: inv } = await supabase
        .from('credit_card_invoices')
        .select('id')
        .eq('credit_card_id', destId)
        .eq('month', month)
        .eq('year', year)
        .single()

      if (inv) {
        invoice_id = inv.id
      } else {
        const { data: newInv, error: invError } = await supabase
          .from('credit_card_invoices')
          .insert({ credit_card_id: destId, month, year, user_id: user!.id })
          .select('id')
          .single()
        if (invError) { onError?.(invError.message); return }
        invoice_id = newInv?.id ?? null
      }
    }

    const { error } = await supabase.from('transactions').insert({
      user_id: user!.id,
      type: data.type,
      amount: data.amount,
      description: data.description ?? null,
      date: data.date,
      category_id: data.category_id,
      account_id: isCard ? null : destId,
      invoice_id,
    })

    if (error) { onError?.(error.message); return }
    onSuccess?.('Transação criada!')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex rounded-lg border border-gray-200 p-1">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setValue('type', t)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              type === t
                ? t === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'expense' ? 'Saída' : 'Entrada'}
          </button>
        ))}
      </div>

      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <CurrencyInput
            label="Valor"
            value={field.value}
            onChange={(v) => field.onChange(v)}
            error={errors.amount?.message}
            required
          />
        )}
      />

      <Input label="Descrição" placeholder="Opcional" {...register('description')} />
      <DatePicker label="Data" error={errors.date?.message} required {...register('date')} />

      <Select label="Categoria" error={errors.category_id?.message} required placeholder="Selecione..." {...register('category_id')}>
        {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>

      <Select label="Conta / Cartão" error={errors.destination?.message} required placeholder="Selecione..." {...register('destination')}>
        {destinationOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" className="rounded" {...register('is_recurring')} />
        Lançamento recorrente
      </label>

      {isRecurring && (
        <Select label="Frequência" error={errors.frequency_days?.message} required placeholder="Selecione..." {...register('frequency_days')}>
          <option value={7}>A cada 7 dias (semanal)</option>
          <option value={14}>A cada 14 dias (quinzenal)</option>
          <option value={30}>A cada 30 dias (mensal)</option>
        </Select>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" loading={isSubmitting}>Salvar</Button>
      </div>
    </form>
  )
}
