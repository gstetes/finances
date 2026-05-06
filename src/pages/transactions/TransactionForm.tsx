import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addMonths } from 'date-fns'
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
  payment_date: z.string().min(1, 'Data de pagamento obrigatória'),
  category_id: z.string().min(1, 'Categoria obrigatória'),
  destination: z.string().min(1, 'Conta ou cartão obrigatório'),
  is_recurring: z.boolean(),
  frequency_days: z.string().optional().transform((v) => (v === '' || v === undefined ? undefined : parseInt(v, 10))).pipe(z.number().optional()),
  is_installment: z.boolean(),
  installments: z.string().optional().transform((v) => (v === '' || v === undefined ? undefined : parseInt(v, 10))).pipe(z.number().min(2).max(48).optional()),
}).refine((d) => !d.is_recurring || d.frequency_days, {
  message: 'Selecione a frequência',
  path: ['frequency_days'],
}).refine((d) => !d.is_installment || (d.installments && d.installments >= 2), {
  message: 'Mínimo 2 parcelas',
  path: ['installments'],
})

type FormInput = z.input<typeof schema>
type FormData = z.output<typeof schema>

interface TransactionFormProps {
  onSuccess?: (message: string) => void
  onCancel?: () => void
  onError?: (message: string) => void
}

async function getOrCreateInvoice(creditCardId: string, userId: string, paymentDate: string) {
  const d = new Date(paymentDate)
  const month = d.getMonth() + 1
  const year = d.getFullYear()

  const { data: inv } = await supabase
    .from('credit_card_invoices')
    .select('id')
    .eq('credit_card_id', creditCardId)
    .eq('month', month)
    .eq('year', year)
    .single()

  if (inv) return { id: inv.id, error: null }

  const { data: newInv, error } = await supabase
    .from('credit_card_invoices')
    .insert({ credit_card_id: creditCardId, month, year, user_id: userId })
    .select('id')
    .single()

  return { id: newInv?.id ?? null, error }
}

export function TransactionForm({ onSuccess, onCancel, onError }: TransactionFormProps) {
  const { categories } = useCategories()
  const { accounts } = useAccounts()
  const { cards } = useCreditCards()

  const today = format(new Date(), 'yyyy-MM-dd')

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
      date: today,
      payment_date: today,
      is_recurring: false,
      is_installment: false,
      amount: 0,
    },
  })

  const type = watch('type')
  const isRecurring = watch('is_recurring')
  const isInstallment = watch('is_installment')
  const destination = watch('destination') ?? ''
  const isCard = destination.startsWith('card:')

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both')

  const destinationOptions = [
    ...accounts.map((a) => ({ value: `account:${a.id}`, label: `🏦 ${a.name}` })),
    ...cards.map((c) => ({ value: `card:${c.id}`, label: `💳 ${c.name} (crédito)` })),
  ]

  const onSubmit = async (data: FormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    const destIsCard = data.destination.startsWith('card:')
    const destId = data.destination.split(':')[1]

    if (data.is_recurring) {
      const { error } = await supabase.from('recurring_transactions').insert({
        user_id: user!.id,
        type: data.type,
        amount: data.amount,
        description: data.description ?? null,
        category_id: data.category_id,
        account_id: destIsCard ? null : destId,
        credit_card_id: destIsCard ? destId : null,
        frequency_days: data.frequency_days as 7 | 14 | 30,
        next_due_date: data.date,
      })
      if (error) { onError?.(error.message); return }
      onSuccess?.('Lançamento recorrente criado!')
      return
    }

    // Installment: create N transactions spread across consecutive months
    if (destIsCard && data.is_installment && data.installments) {
      const n = data.installments
      const installmentAmount = Math.round((data.amount / n) * 100) / 100

      for (let i = 0; i < n; i++) {
        const paymentDate = format(addMonths(new Date(data.payment_date), i), 'yyyy-MM-dd')
        const { id: invoiceId, error: invError } = await getOrCreateInvoice(destId, user!.id, paymentDate)
        if (invError) { onError?.(invError.message); return }

        const { error } = await supabase.from('transactions').insert({
          user_id: user!.id,
          type: data.type,
          amount: installmentAmount,
          description: data.description ? `${data.description} (${i + 1}/${n})` : `Parcela ${i + 1}/${n}`,
          date: data.date,
          payment_date: paymentDate,
          category_id: data.category_id,
          account_id: null,
          invoice_id: invoiceId,
        })
        if (error) { onError?.(error.message); return }
      }

      onSuccess?.(`${n} parcelas criadas!`)
      return
    }

    // Single transaction
    let invoice_id: string | null = null
    if (destIsCard) {
      const { id, error: invError } = await getOrCreateInvoice(destId, user!.id, data.payment_date)
      if (invError) { onError?.(invError.message); return }
      invoice_id = id
    }

    const { error } = await supabase.from('transactions').insert({
      user_id: user!.id,
      type: data.type,
      amount: data.amount,
      description: data.description ?? null,
      date: data.date,
      payment_date: data.payment_date,
      category_id: data.category_id,
      account_id: destIsCard ? null : destId,
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

      <div className="grid grid-cols-2 gap-3">
        <DatePicker label="Data da compra" error={errors.date?.message} required {...register('date')} />
        <DatePicker label="Data de pagamento" error={errors.payment_date?.message} required {...register('payment_date')} />
      </div>

      <Select label="Categoria" error={errors.category_id?.message} required placeholder="Selecione..." {...register('category_id')}>
        {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>

      <Select
        label="Conta / Cartão"
        error={errors.destination?.message}
        required
        placeholder="Selecione..."
        {...register('destination')}
        onChange={(e) => {
          register('destination').onChange(e)
          // Reset installment when switching away from card
          if (!e.target.value.startsWith('card:')) {
            setValue('is_installment', false)
          }
        }}
      >
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

      {isCard && !isRecurring && (
        <>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="rounded" {...register('is_installment')} />
            Parcelado
          </label>

          {isInstallment && (
            <div>
              <Input
                label="Número de parcelas"
                type="number"
                min={2}
                max={48}
                placeholder="Ex: 12"
                error={errors.installments?.message}
                {...register('installments')}
              />
              <p className="mt-1 text-xs text-gray-400">
                As parcelas serão lançadas a partir do mês da data de pagamento informada.
              </p>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" loading={isSubmitting}>Salvar</Button>
      </div>
    </form>
  )
}
