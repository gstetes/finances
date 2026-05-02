import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CreditCard } from '@/types/database'

type CreatePayload = Omit<CreditCard, 'id' | 'created_at' | 'user_id' | 'is_active'>
type UpdatePayload = Partial<CreatePayload>

export function useCreditCards() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('is_active', true)
      .order('name')
    setCards((data as CreditCard[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: CreatePayload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('credit_cards').insert({ ...payload, user_id: user!.id }).select().single()
    if (!error) setCards((prev) => [...prev, data as CreditCard])
    return { data: data as CreditCard | null, error }
  }

  const update = async (id: string, payload: UpdatePayload) => {
    const { data, error } = await supabase.from('credit_cards').update(payload).eq('id', id).select().single()
    if (!error) setCards((prev) => prev.map((c) => (c.id === id ? (data as CreditCard) : c)))
    return { data: data as CreditCard | null, error }
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('credit_cards').update({ is_active: false }).eq('id', id)
    if (!error) setCards((prev) => prev.filter((c) => c.id !== id))
    return { error }
  }

  return { cards, loading, refetch: fetch, create, update, remove }
}
