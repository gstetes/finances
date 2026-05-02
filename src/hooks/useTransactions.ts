import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '@/types/database'

interface UseTransactionsOptions {
  month?: number
  year?: number
}

export function useTransactions({ month, year }: UseTransactionsOptions = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories(id, name, color, icon),
        account:accounts(id, name, color),
        invoice:credit_card_invoices(id, month, year, credit_card:credit_cards(id, name, color))
      `)
      .order('date', { ascending: false })

    if (month && year) {
      const from = `${year}-${String(month).padStart(2, '0')}-01`
      const to = new Date(year, month, 0).toISOString().split('T')[0]
      query = query.gte('date', from).lte('date', to)
    }

    const { data } = await query
    setTransactions((data as Transaction[]) ?? [])
    setLoading(false)
  }, [month, year])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: Omit<Transaction, 'id' | 'created_at' | 'user_id' | 'category' | 'account' | 'invoice'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('transactions').insert({ ...payload, user_id: user!.id }).select(`
      *,
      category:categories(id, name, color, icon),
      account:accounts(id, name, color),
      invoice:credit_card_invoices(id, month, year, credit_card:credit_cards(id, name, color))
    `).single()
    if (!error) setTransactions((prev) => [data as Transaction, ...prev])
    return { data: data as Transaction | null, error }
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) setTransactions((prev) => prev.filter((t) => t.id !== id))
    return { error }
  }

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)

  const balance = totalIncome - totalExpense

  return { transactions, loading, refetch: fetch, create, remove, totalIncome, totalExpense, balance }
}
