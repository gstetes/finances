import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RecurringTransaction, Category, Account, CreditCard } from '@/types/database'

export interface RecurringTransactionWithRelations extends RecurringTransaction {
  category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'> | null
  account?: Pick<Account, 'id' | 'name' | 'color'> | null
  credit_card?: Pick<CreditCard, 'id' | 'name' | 'color'> | null
}

export function useRecurringTransactions() {
  const [recurring, setRecurring] = useState<RecurringTransactionWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('recurring_transactions')
      .select(`
        *,
        category:categories(id, name, color, icon),
        account:accounts(id, name, color),
        credit_card:credit_cards(id, name, color)
      `)
      .eq('is_active', true)
      .order('next_due_date', { ascending: true })

    setRecurring((data as RecurringTransactionWithRelations[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const remove = async (id: string) => {
    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
    if (!error) setRecurring((prev) => prev.filter((r) => r.id !== id))
    return { error }
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from('recurring_transactions').update({ is_active }).eq('id', id)
    if (!error) setRecurring((prev) => prev.map((r) => r.id === id ? { ...r, is_active } : r))
    return { error }
  }

  return { recurring, loading, refetch: fetch, remove, toggleActive }
}
