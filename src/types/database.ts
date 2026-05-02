export type AccountType = 'checking' | 'savings' | 'cash' | 'investment' | 'other'
export type TransactionType = 'income' | 'expense'
export type InvoiceStatus = 'open' | 'closed' | 'paid'
export type CategoryType = 'income' | 'expense' | 'both'
export type FrequencyDays = 7 | 14 | 30

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string | null
  is_default: boolean
  type: CategoryType
  created_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  color: string
  icon: string | null
  is_active: boolean
  created_at: string
}

export interface CreditCard {
  id: string
  user_id: string
  name: string
  limit_amount: number
  closing_day: number
  due_day: number
  color: string
  brand: string | null
  is_active: boolean
  created_at: string
}

export interface CreditCardInvoice {
  id: string
  credit_card_id: string
  user_id: string
  month: number
  year: number
  status: InvoiceStatus
  total_amount: number
  paid_at: string | null
  due_date: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string | null
  date: string
  category_id: string | null
  account_id: string | null
  invoice_id: string | null
  is_recurring: boolean
  recurring_id: string | null
  created_at: string
  // Joined relations (populated by select queries)
  category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'> | null
  account?: Pick<Account, 'id' | 'name' | 'color'> | null
  invoice?: (Pick<CreditCardInvoice, 'id' | 'month' | 'year'> & {
    credit_card: Pick<CreditCard, 'id' | 'name' | 'color'> | null
  }) | null
}

export interface RecurringTransaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string | null
  category_id: string | null
  account_id: string | null
  credit_card_id: string | null
  frequency_days: FrequencyDays
  next_due_date: string
  is_active: boolean
  created_at: string
}

// Minimal Database shape for createClient<Database>.
// Run `supabase gen types typescript` to replace with the full generated version.
// Using `any` for Insert/Update avoids false-positive "never" errors in hooks.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: AnyRow; Update: AnyRow }
      categories: { Row: Category; Insert: AnyRow; Update: AnyRow }
      accounts: { Row: Account; Insert: AnyRow; Update: AnyRow }
      credit_cards: { Row: CreditCard; Insert: AnyRow; Update: AnyRow }
      credit_card_invoices: { Row: CreditCardInvoice; Insert: AnyRow; Update: AnyRow }
      transactions: { Row: Transaction; Insert: AnyRow; Update: AnyRow }
      recurring_transactions: { Row: RecurringTransaction; Insert: AnyRow; Update: AnyRow }
    }
  }
}
