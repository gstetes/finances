import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async () => {
  const today = new Date().toISOString().split('T')[0]

  const { data: due, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .lte('next_due_date', today)
    .eq('is_active', true)

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })

  const results = await Promise.all(
    (due ?? []).map(async (r) => {
      let invoice_id: string | null = null

      if (r.credit_card_id) {
        const d = new Date(today)
        const month = d.getMonth() + 1
        const year = d.getFullYear()

        const { data: inv } = await supabase
          .from('credit_card_invoices')
          .select('id')
          .eq('credit_card_id', r.credit_card_id)
          .eq('month', month)
          .eq('year', year)
          .single()

        if (inv) {
          invoice_id = inv.id
        } else {
          const { data: newInv } = await supabase
            .from('credit_card_invoices')
            .insert({ credit_card_id: r.credit_card_id, user_id: r.user_id, month, year })
            .select('id')
            .single()
          invoice_id = newInv?.id ?? null
        }
      }

      await supabase.from('transactions').insert({
        user_id: r.user_id,
        type: r.type,
        amount: r.amount,
        description: r.description,
        date: today,
        category_id: r.category_id,
        account_id: r.credit_card_id ? null : r.account_id,
        invoice_id,
        is_recurring: true,
        recurring_id: r.id,
      })

      const nextDate = new Date(r.next_due_date)
      nextDate.setDate(nextDate.getDate() + r.frequency_days)

      await supabase
        .from('recurring_transactions')
        .update({ next_due_date: nextDate.toISOString().split('T')[0] })
        .eq('id', r.id)

      return r.id
    }),
  )

  return new Response(JSON.stringify({ processed: results.length, ids: results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
