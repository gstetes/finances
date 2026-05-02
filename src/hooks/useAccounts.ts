import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Account, AccountType } from '@/types/database'

interface CreatePayload {
  name: string
  type: AccountType
  balance?: number
  color?: string
  icon?: string | null
  is_active?: boolean
}

type UpdatePayload = Partial<CreatePayload>

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('accounts').select('*').eq('is_active', true).order('name')
    setAccounts((data as Account[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: CreatePayload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('accounts').insert({ ...payload, user_id: user!.id }).select().single()
    if (!error) setAccounts((prev) => [...prev, data as Account])
    return { data: data as Account | null, error }
  }

  const update = async (id: string, payload: UpdatePayload) => {
    const { data, error } = await supabase.from('accounts').update(payload).eq('id', id).select().single()
    if (!error) setAccounts((prev) => prev.map((a) => (a.id === id ? (data as Account) : a)))
    return { data: data as Account | null, error }
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('accounts').update({ is_active: false }).eq('id', id)
    if (!error) setAccounts((prev) => prev.filter((a) => a.id !== id))
    return { error }
  }

  return { accounts, loading, refetch: fetch, create, update, remove }
}
